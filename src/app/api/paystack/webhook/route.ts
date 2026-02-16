import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updatePaymentProof, updateOrderStatus as sheetsUpdateOrderStatus, appendRegistration } from '@/lib/googleSheets';
import { updateOrderStatus as mongoUpdateOrderStatus } from '@/lib/storeService';
import { sendRegistrationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      console.error('PAYSTACK_SECRET_KEY is not defined');
      return new Response('Configuration Error', { status: 500 });
    }

    // Verify signature
    const hash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex');

    const signature = request.headers.get('x-paystack-signature');

    if (hash !== signature) {
      console.warn('Invalid Paystack signature');
      return new Response('Invalid Signature', { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.success') {
      const data = event.data;
      const { reference, metadata, amount } = data;
      const type = metadata?.transaction_type;

      console.log(`[Webhook] Payment Success: ${reference}, Type: ${type}, Amount: ${amount / 100}`);

      const paymentInfo = `Paystack Ref: ${reference}`;

      switch (type) {
        case 'registration': {
          const isBulk = metadata?.isBulk;

          if (isBulk) {
            // Bulk registration: register each person (fallback if callback didn't fire)
            const registrationDataList = metadata?.registrationDataList || [];
            for (const regData of registrationDataList) {
              try {
                const uniqueId = await appendRegistration(regData);
                // Update payment proof
                await updatePaymentProof(uniqueId, paymentInfo, 'registration');
                // Send email
                if (regData.email && regData.fullName) {
                  sendRegistrationEmail(regData.email, regData.fullName, uniqueId, paymentInfo)
                    .catch(err => console.error("Webhook bulk email failed:", err));
                }
              } catch (regErr: any) {
                // If registration already exists from callback, this will fail - that's OK
                console.warn('[Webhook] Bulk reg might already exist:', regErr.message);
              }
            }
          } else {
            // Single registration
            const registrationData = metadata?.registrationData;
            if (registrationData) {
              try {
                const uniqueId = await appendRegistration(registrationData);
                await updatePaymentProof(uniqueId, paymentInfo, 'registration');
                if (registrationData.email && registrationData.fullName) {
                  sendRegistrationEmail(registrationData.email, registrationData.fullName, uniqueId, paymentInfo)
                    .catch(err => console.error("Webhook reg email failed:", err));
                }
              } catch (regErr: any) {
                // If registration already exists from callback, update payment proof using uniqueId in metadata
                const existingId = metadata?.uniqueId;
                if (existingId) {
                  await updatePaymentProof(existingId, paymentInfo, 'registration');
                }
                console.warn('[Webhook] Reg might already exist:', regErr.message);
              }
            } else if (metadata?.uniqueId) {
              // Legacy: just update payment proof for existing registration
              await updatePaymentProof(metadata.uniqueId, paymentInfo, 'registration');
            }
          }
          break;
        }

        case 'store': {
          const orderId = metadata?.orderId;
          if (orderId) {
            await mongoUpdateOrderStatus(orderId, 'Paid');
            await sheetsUpdateOrderStatus(orderId, 'Paid');
          }
          break;
        }

        case 'accommodation': {
          const uniqueId = metadata?.uniqueId;
          if (uniqueId) {
            await updatePaymentProof(uniqueId, paymentInfo, 'accommodation');
          }
          break;
        }

        default:
          console.warn('[Webhook] Unknown transaction type:', type);
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    console.error('Paystack Webhook error:', error);
    return new Response('Webhook Error', { status: 500 });
  }
}
