import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateOrderStatus as sheetsUpdateOrderStatus } from '@/lib/googleSheets';
import { updateOrderStatus as mongoUpdateOrderStatus, getOrderByOrderId } from '@/lib/storeService';
import { 
  updateRegistrationStatus, 
  getUserById, 
  findByPaymentReference,
  updatePaymentReference 
} from '@/lib/registrationService';
import { sendWelcomeEmail, sendOrderConfirmationEmail, sendRegistrationEmail } from '@/lib/email';
import * as QRCode from 'qrcode';

export async function POST(request: Request) {
  try {
    const body = await request.text();

    // --- DUAL KEY SIGNATURE VERIFICATION ---
    // We have two Paystack accounts (store + registration), each with its own secret key.
    // The webhook signature is signed with whichever key belongs to the account that
    // processed the payment, so we need to check against both keys.
    const storeSecret = process.env.PAYSTACK_SECRET_KEY;
    const regSecret = process.env.PAYSTACK_REG_SECRET_KEY;

    if (!storeSecret && !regSecret) {
      console.error('No Paystack secret keys are defined');
      return new Response('Configuration Error', { status: 500 });
    }

    let signatureValid = false;
    const signature = request.headers.get('x-paystack-signature');

    if (storeSecret) {
      const storeHash = crypto.createHmac('sha512', storeSecret).update(body).digest('hex');
      if (storeHash === signature) signatureValid = true;
    }

    if (!signatureValid && regSecret) {
      const regHash = crypto.createHmac('sha512', regSecret).update(body).digest('hex');
      if (regHash === signature) signatureValid = true;
    }

    if (!signatureValid) {
      console.warn('Invalid Paystack signature (checked both keys)');
      return new Response('Invalid Signature', { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.success') {
      const data = event.data;
      const { reference, metadata, amount } = data;
      const type = metadata?.transaction_type;

      console.log(`[Webhook] Payment Success: ${reference}, Type: ${type}, Amount: ${amount / 100}`);

      switch (type) {
        case 'store': {
          const orderId = metadata?.orderId;
          if (orderId) {
            await mongoUpdateOrderStatus(orderId, 'Paid');
            await sheetsUpdateOrderStatus(orderId, 'Paid');

            // Send order confirmation email
            try {
              const order = await getOrderByOrderId(orderId);
              if (order && order.customerEmail) {
                await sendOrderConfirmationEmail(
                  order.customerEmail,
                  order.customerName || 'Customer',
                  orderId
                );
              }
            } catch (emailErr) {
              console.error('[Webhook] Failed to send order confirmation email:', emailErr);
            }
          }
          break;
        }

        case 'registration': {
          // --- IDEMPOTENCY CHECK ---
          const existingReg = await findByPaymentReference(reference);
          if (existingReg && existingReg.registrationStatus === 'Confirmed') {
            console.log(`[Webhook] Reference ${reference} already confirmed for ${existingReg.uniqueId}, skipping`);
            break;
          }

          const isBulk = metadata?.isBulk;

          if (isBulk) {
            // Bulk registration
            const uniqueIds: string[] = metadata?.uniqueIds || [];
            for (const uid of uniqueIds) {
              try {
                await updateRegistrationStatus(uid, 'Confirmed');
                await updatePaymentReference(uid, reference);
              } catch (err) {
                console.error(`[Webhook] Failed to confirm bulk reg ${uid}:`, err);
              }
            }
            console.log(`[Webhook] Confirmed ${uniqueIds.length} bulk registrations`);
          } else {
            // Single registration
            const uniqueId = metadata?.uniqueId;
            if (uniqueId) {
              try {
                await updateRegistrationStatus(uniqueId, 'Confirmed');
                await updatePaymentReference(uniqueId, reference);
                console.log(`[Webhook] Confirmed registration: ${uniqueId}`);

                // Try to send email (non-blocking)
                try {
                  const user = await getUserById(uniqueId);
                  if (user && user.email && user.fullName) {
                    const registrationData = metadata?.registrationData;
                    if (registrationData) {
                      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                      const scanUrl = `${baseUrl}/admin/users/${uniqueId}`;
                      const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
                        width: 300, margin: 2,
                        color: { dark: '#000000', light: '#ffffff' }
                      });
                      await sendRegistrationEmail(
                        user.email, user.fullName, uniqueId, reference, qrCodeDataUrl
                      );
                    } else {
                      await sendWelcomeEmail(user.email, user.fullName);
                    }
                  }
                } catch (emailErr) {
                  console.error(`[Webhook] Email failed for ${uniqueId}:`, emailErr);
                }
              } catch (err) {
                console.error(`[Webhook] Failed to confirm registration ${uniqueId}:`, err);
              }
            } else {
              console.warn('[Webhook] Registration webhook but no uniqueId in metadata');
            }
          }
          break;
        }

        default:
          console.warn('[Webhook] Unknown transaction type:', type);
      }
    }

    // Always return 200 quickly to prevent Paystack retries
    return new Response('OK', { status: 200 });
  } catch (error: any) {
    console.error('Paystack Webhook error:', error);
    return new Response('Webhook Error', { status: 500 });
  }
}
