import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { appendRegistration } from '@/lib/googleSheets';
import { sendRegistrationEmail } from '@/lib/email';

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
      case 'registration': {
        const isBulk = data.metadata?.isBulk;

        if (isBulk) {
          // Bulk registration: register each person
          const registrationDataList = data.metadata?.registrationDataList || [];
          const registeredIds: string[] = [];

          for (const regData of registrationDataList) {
            try {
              const uniqueId = await appendRegistration(regData);
              registeredIds.push(uniqueId);

              // Send email to each registrant
              if (regData.email && regData.fullName) {
                sendRegistrationEmail(
                  regData.email,
                  regData.fullName,
                  uniqueId,
                  `Paystack Ref: ${reference}`
                ).catch(err => console.error("Bulk reg email failed:", err));
              }
            } catch (regErr: any) {
              console.error('Bulk registration error for:', regData.fullName, regErr);
            }
          }

          redirectUrl = `/?status=success&type=bulk&count=${registeredIds.length}`;
        } else {
          // Single registration
          const registrationData = data.metadata?.registrationData;
          if (registrationData) {
            try {
              const uniqueId = await appendRegistration(registrationData);
              
              if (registrationData.email && registrationData.fullName) {
                sendRegistrationEmail(
                  registrationData.email,
                  registrationData.fullName,
                  uniqueId,
                  `Paystack Ref: ${reference}`
                ).catch(err => console.error("Registration email failed:", err));
              }

              redirectUrl = `/?status=success&uniqueId=${uniqueId}&type=registration`;
            } catch (regError: any) {
              console.error('Registration after payment failed:', regError);
              redirectUrl = `/?status=error&message=${encodeURIComponent('Payment received but registration failed. Contact support with ref: ' + reference)}`;
            }
          } else {
            redirectUrl = '/?status=success&type=registration';
          }
        }
        break;
      }
      case 'store':
        redirectUrl = '/store?status=success';
        break;
      case 'accommodation':
        redirectUrl = '/book-accommodation?status=success';
        break;
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/?status=error', request.url));
  }
}
