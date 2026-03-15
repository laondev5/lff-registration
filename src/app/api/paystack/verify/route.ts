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
      const registrationData = paystackData.metadata?.registrationData;
      
      if (uniqueId) {
        // Found pre-saved registration, confirm it
        const existingUser = await getUserById(uniqueId);
        
        if (existingUser) {
          // User exists in DB — just confirm status
          try {
            await updateRegistrationStatus(uniqueId, 'Confirmed');
            await updatePaymentReference(uniqueId, reference);

            // Try to send email
            try {
              if (existingUser.email) {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                const scanUrl = `${baseUrl}/admin/users/${uniqueId}`;
                const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
                  width: 300, margin: 2,
                  color: { dark: '#000000', light: '#ffffff' }
                });
                await sendRegistrationEmail(
                  existingUser.email, 
                  existingUser.fullName || registrationData?.fullName || '', 
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
              data: { uniqueId, reference, fullName: existingUser.fullName }
            });
          } catch (err: any) {
            console.error('[Verify] Failed to confirm registration:', err);
            return NextResponse.json(
              { success: false, error: 'Failed to confirm registration. Please contact support.' },
              { status: 500 }
            );
          }
        } else if (registrationData) {
          // User NOT in DB but we have the data from Paystack metadata — create it
          try {
            const { appendRegistration } = await import('@/lib/registrationService');
            const newUniqueId = await appendRegistration({
              ...registrationData,
              registrationStatus: 'Confirmed',
              paymentReference: reference,
            });
            await updatePaymentReference(newUniqueId, reference);

            // Try to send email
            try {
              if (registrationData.email) {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                const scanUrl = `${baseUrl}/admin/users/${newUniqueId}`;
                const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
                  width: 300, margin: 2,
                  color: { dark: '#000000', light: '#ffffff' }
                });
                await sendRegistrationEmail(
                  registrationData.email, 
                  registrationData.fullName || '', 
                  newUniqueId, reference, qrCodeDataUrl
                );
              }
            } catch (emailErr) {
              console.error('[Verify] Email failed but registration recovered:', emailErr);
            }

            return NextResponse.json({
              success: true,
              recovered: true,
              message: 'Payment verified! Registration has been recovered and confirmed.',
              data: { uniqueId: newUniqueId, reference, fullName: registrationData.fullName }
            });
          } catch (err: any) {
            console.error('[Verify] Failed to recover registration from metadata:', err);
            return NextResponse.json(
              { success: false, error: 'Payment verified but failed to create registration. Please contact support with reference: ' + reference },
              { status: 500 }
            );
          }
        }
      }

      // Handle bulk registrations
      if (paystackData.metadata?.registrationDataList) {
        try {
          const { appendRegistration } = await import('@/lib/registrationService');
          const recoveredIds: string[] = [];
          
          for (const regItem of paystackData.metadata.registrationDataList) {
            const uid = await appendRegistration({
              ...regItem,
              registrationStatus: 'Confirmed',
              paymentReference: reference,
            });
            recoveredIds.push(uid);

            // Send confirmation email to each registrant
            try {
              if (regItem.email) {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                const scanUrl = `${baseUrl}/admin/users/${uid}`;
                const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
                  width: 300, margin: 2,
                  color: { dark: '#000000', light: '#ffffff' }
                });
                await sendRegistrationEmail(regItem.email, regItem.fullName || '', uid, reference, qrCodeDataUrl);
              }
            } catch (emailErr) {
              console.error(`[Verify] Email failed for bulk reg ${uid}:`, emailErr);
            }
          }

          return NextResponse.json({
            success: true,
            recovered: true,
            message: `Payment verified! ${recoveredIds.length} registration(s) recovered and confirmed.`,
            data: { uniqueIds: recoveredIds, reference }
          });
        } catch (err: any) {
          console.error('[Verify] Failed to recover bulk registrations:', err);
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
