import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { findByPaymentReference } from '@/lib/registrationService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json(
      { success: false, error: 'Missing reference parameter' },
      { status: 400 }
    );
  }

  try {
    // 1. Check if already processed and confirmed in our DB
    const existingReg = await findByPaymentReference(reference);
    if (existingReg && existingReg.registrationStatus === 'Confirmed') {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: 'This payment has already been confirmed.',
        data: {
          uniqueId: existingReg.uniqueId,
          fullName: existingReg.fullName,
          status: existingReg.registrationStatus,
        }
      });
    }

    // 2. Fetch directly from Paystack
    let paystackData: any = null;
    
    // Try registration key first
    try {
      paystackData = await verifyTransaction(reference, 'registration');
    } catch {
      return NextResponse.json(
        { success: false, error: 'Transaction not found on Paystack or invalid key. Please check your reference.' },
        { status: 404 }
      );
    }

    if (paystackData.status !== 'success') {
      return NextResponse.json({
        success: false,
        paystackStatus: paystackData.status,
        message: `Payment status on Paystack: ${paystackData.status}.`
      });
    }

    // 3. Return the metadata without saving to DB yet
    return NextResponse.json({
      success: true,
      recovered: false, // It's not recovered into the DB yet
      message: 'Payment found on Paystack. Please complete your registration details.',
      metadata: paystackData.metadata,
      amount: paystackData.amount / 100, // Convert kobo to NGN
      paystackStatus: paystackData.status,
    });

  } catch (error: any) {
    console.error('[Fetch Metadata] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transaction metadata' },
      { status: 500 }
    );
  }
}
