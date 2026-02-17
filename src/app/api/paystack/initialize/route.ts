import { NextResponse } from 'next/server';
import { initializeTransaction } from '@/lib/paystack';

export async function POST(request: Request) {
  try {
    const { email, amount, type, metadata } = await request.json();

    console.log('Paystack Initialize Request:', { email, amount, type, metadata });

    if (!email || amount === undefined || amount === null || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: `Invalid amount: ${amount}` },
        { status: 400 }
      );
    }

    let subaccount = '';
    switch (type) {
      case 'store':
        subaccount = process.env.PAYSTACK_STORE_SUBACCOUNT || '';
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid transaction type' },
          { status: 400 }
        );
    }

    const transaction = await initializeTransaction({
      email,
      amount: parsedAmount,
      subaccount,
      metadata: {
        ...metadata,
        transaction_type: type,
      },
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: any) {
    console.error('Paystack Initialization Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
