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

    // Derive the base URL from the request so it works on any device/deployment
    let origin = request.headers.get('origin') || '';
    if (!origin) {
      try {
        const referer = request.headers.get('referer');
        if (referer) origin = new URL(referer).origin;
      } catch { /* ignore invalid referer */ }
    }
    if (!origin) {
      origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
    const callbackUrl = `${origin}/api/paystack/callback?type=${type}`;

    let subaccount = '';
    switch (type) {
      case 'store':
        subaccount = process.env.PAYSTACK_STORE_SUBACCOUNT || '';
        break;
      case 'registration':
        subaccount = process.env.PAYSTACK_REGISTRATION_SUBACCOUNT || '';
        
        // Slot validation for accommodation
        const regData = metadata?.registrationData;
        if (regData?.needsAccommodation) {
          const { getAccommodationsWithAvailability } = await import('@/lib/accommodationService');
          const accommodations = await getAccommodationsWithAvailability();
          
          const selectedAcc = accommodations.find(
            (a: any) => a.title === regData.accommodationType || a.id === regData.accommodationId
          );

          if (selectedAcc && selectedAcc.isFullyBooked) {
             return NextResponse.json(
               { success: false, error: 'The selected accommodation is currently fully booked. Please select another one.' },
               { status: 400 }
             );
          }
        }
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
      callback_url: callbackUrl,
      subaccount,
      type: type as 'registration' | 'store',
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
