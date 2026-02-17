import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateOrderStatus as sheetsUpdateOrderStatus } from '@/lib/googleSheets';
import { updateOrderStatus as mongoUpdateOrderStatus } from '@/lib/storeService';

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
