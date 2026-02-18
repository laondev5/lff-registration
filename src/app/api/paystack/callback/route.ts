import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const data = await verifyTransaction(reference);
    const type = data.metadata?.transaction_type;

    let redirectUrl = '/';
    switch (type) {
      case 'store':
        redirectUrl = `/store/order-success?orderId=${reference}&clearCart=true`;
        break;
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/?status=error', request.url));
  }
}
