import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateOrderStatus as sheetsUpdateOrderStatus } from '@/lib/googleSheets';
import { updateOrderStatus as mongoUpdateOrderStatus, getOrderByOrderId } from '@/lib/storeService';
import { updateRegistrationStatus, getUserById } from '@/lib/registrationService';
import { sendWelcomeEmail, sendOrderConfirmationEmail } from '@/lib/email';

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
          const uniqueId = metadata?.uniqueId;
          if (uniqueId) {
            // Auto-confirm registration payment
            await updateRegistrationStatus(uniqueId, 'Confirmed');

            // Send welcome/confirmation email
            try {
              const user = await getUserById(uniqueId);
              if (user && user.email && user.fullName) {
                await sendWelcomeEmail(user.email, user.fullName);
              }
            } catch (emailErr) {
              console.error('[Webhook] Failed to send registration confirmation email:', emailErr);
            }
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
