import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { 
  findByPaymentReference, 
  updateRegistrationStatus, 
  updatePaymentReference,
  getUserById 
} from '@/lib/registrationService';
import { sendRegistrationEmail } from '@/lib/email';
import * as QRCode from 'qrcode';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  const type = searchParams.get('type') as 'registration' | 'store' | undefined;

  if (!reference) {
    return NextResponse.json(
      { success: false, error: 'Missing reference parameter' },
      { status: 400 }
    );
  }

  try {
    // First check if already processed
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

    // Verify with Paystack
    // Try registration key first, then store key
    let paystackData: any = null;
    let verifyType = type;

    if (!verifyType) {
      // Try registration key first
      try {
        paystackData = await verifyTransaction(reference, 'registration');
      } catch {
        // If registration key fails, try store key
        try {
          paystackData = await verifyTransaction(reference, 'store');
          verifyType = 'store';
        } catch {
          return NextResponse.json(
            { success: false, error: 'Transaction not found on Paystack. Please check your reference.' },
            { status: 404 }
          );
        }
      }
    } else {
      paystackData = await verifyTransaction(reference, verifyType);
    }

    if (paystackData.status !== 'success') {
      return NextResponse.json({
        success: false,
        paystackStatus: paystackData.status,
        message: `Payment status on Paystack: ${paystackData.status}. ${
          paystackData.status === 'failed' 
            ? 'Your bank should reverse the charge within 24 hours. If not, please contact your bank.'
            : 'Please wait for the payment to complete.'
        }`
      });
    }

    // Payment is successful on Paystack! Let's recover the registration.
    const transactionType = paystackData.metadata?.transaction_type;
    
    if (transactionType === 'registration') {
      const uniqueId = paystackData.metadata?.uniqueId;
      
      if (uniqueId) {
        // Found pre-saved registration, confirm it
        try {
          await updateRegistrationStatus(uniqueId, 'Confirmed');
          await updatePaymentReference(uniqueId, reference);

          // Try to send email
          try {
            const user = await getUserById(uniqueId);
            const registrationData = paystackData.metadata?.registrationData;
            if (user && user.email) {
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
              const scanUrl = `${baseUrl}/admin/scanner?id=${uniqueId}`;
              const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
                width: 300, margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
              });
              await sendRegistrationEmail(
                user.email, 
                user.fullName || registrationData?.fullName || '', 
                uniqueId, reference, qrCodeDataUrl
              );
            }
          } catch (emailErr) {
            console.error('[Verify] Email failed but registration confirmed:', emailErr);
          }

          return NextResponse.json({
            success: true,
            recovered: true,
            message: 'Payment verified and registration confirmed!',
            data: { uniqueId, reference }
          });
        } catch (err: any) {
          console.error('[Verify] Failed to confirm registration:', err);
          return NextResponse.json(
            { success: false, error: 'Failed to confirm registration. Please contact support.' },
            { status: 500 }
          );
        }
      }
    }

    // Generic success response for store or unknown types
    return NextResponse.json({
      success: true,
      message: 'Payment verified as successful on Paystack.',
      data: {
        reference,
        amount: paystackData.amount / 100,
        status: paystackData.status,
        type: transactionType,
      }
    });

  } catch (error: any) {
    console.error('[Verify] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
