import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import {
  appendRegistration,
  updateRegistrationStatus,
  findByPaymentReference,
  updatePaymentReference,
  getUserById
} from '@/lib/registrationService';
import { sendRegistrationEmail } from '@/lib/email';
import * as QRCode from 'qrcode';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  const isAdminPayment = searchParams.get('admin') === 'true';

  if (!reference) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const typeFromQuery = searchParams.get('type') as 'registration' | 'store' | undefined;
    const data = await verifyTransaction(reference, typeFromQuery);

    if (data.status !== 'success') {
      console.warn(`Payment not successful. Reference: ${reference}, Status: ${data.status}`);
      const failUrl = isAdminPayment
        ? '/admin/paystack-payments?status=error&message=PaymentNotSuccessful'
        : '/?status=error&message=PaymentNotSuccessful';
      return NextResponse.redirect(new URL(failUrl, request.url));
    }

    const type = data.metadata?.transaction_type;

    let redirectUrl = '/';
    switch (type) {
      case 'store':
        redirectUrl = `/store/order-success?orderId=${reference}&clearCart=true`;
        break;

      case 'registration': {
        // --- IDEMPOTENCY CHECK ---
        // Check if this reference was already processed
        const existingReg = await findByPaymentReference(reference);
        if (existingReg && existingReg.registrationStatus === 'Confirmed') {
          console.log(`[Callback] Reference ${reference} already processed for ${existingReg.uniqueId}`);
          redirectUrl = isAdminPayment
            ? `/admin/paystack-payments?status=success&uniqueId=${existingReg.uniqueId}`
            : `/?status=success&uniqueId=${existingReg.uniqueId}`;
          break;
        }

        const isBulk = data.metadata?.isBulk;

        if (isBulk) {
          // --- BULK REGISTRATION ---
          const uniqueIds: string[] = data.metadata?.uniqueIds || [];

          if (uniqueIds.length > 0) {
            // Registrations were pre-saved in initialize route, just confirm them
            for (const uid of uniqueIds) {
              try {
                await updateRegistrationStatus(uid, 'Confirmed');
                if (!existingReg) {
                  await updatePaymentReference(uid, reference);
                }

                // Send confirmation email to each registrant
                try {
                  const user = await getUserById(uid);
                  if (user && user.email && user.fullName) {
                    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                    const scanUrl = `${baseUrl}/admin/users/${uid}`;
                    const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
                      width: 300, margin: 2,
                      color: { dark: '#000000', light: '#ffffff' }
                    });
                    await sendRegistrationEmail(user.email, user.fullName, uid, reference, qrCodeDataUrl);
                  }
                } catch (emailErr) {
                  console.error(`[Callback] Email failed for bulk reg ${uid}:`, emailErr);
                }
              } catch (err) {
                console.error(`[Callback] Failed to confirm bulk registration ${uid}:`, err);
              }
            }
            redirectUrl = isAdminPayment
              ? `/admin/paystack-payments?status=success&bulk=true&count=${uniqueIds.length}`
              : `/?status=success&uniqueId=${uniqueIds[0]}&bulk=true&count=${uniqueIds.length}`;
          } else {
            // Fallback: bulk registrations not pre-saved (shouldn't happen with new flow)
            const registrationDataList = data.metadata?.registrationDataList;
            if (registrationDataList && Array.isArray(registrationDataList)) {
              const newIds: string[] = [];
              for (const regData of registrationDataList) {
                try {
                  const uid = await appendRegistration({ ...regData, paymentReference: reference });
                  await updateRegistrationStatus(uid, 'Confirmed');
                  newIds.push(uid);

                  // Send confirmation email to each registrant
                  try {
                    if (regData.email) {
                      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                      const scanUrl = `${baseUrl}/admin/users/${uid}`;
                      const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
                        width: 300, margin: 2,
                        color: { dark: '#000000', light: '#ffffff' }
                      });
                      await sendRegistrationEmail(regData.email, regData.fullName || '', uid, reference, qrCodeDataUrl);
                    }
                  } catch (emailErr) {
                    console.error(`[Callback] Email failed for bulk reg ${uid}:`, emailErr);
                  }
                } catch (err) {
                  console.error('[Callback] Failed to create bulk registration:', err);
                }
              }
              if (newIds.length > 0) {
                redirectUrl = isAdminPayment
                  ? `/admin/paystack-payments?status=success&bulk=true&count=${newIds.length}`
                  : `/?status=success&uniqueId=${newIds[0]}&bulk=true&count=${newIds.length}`;
              } else {
                redirectUrl = isAdminPayment
                  ? `/admin/paystack-payments?status=error&message=RegistrationFailed`
                  : `/?status=error&message=RegistrationFailed`;
              }
            }
          }
        } else {
          // --- SINGLE REGISTRATION ---
          const uniqueId = data.metadata?.uniqueId;
          const registrationData = data.metadata?.registrationData;

          let finalUniqueId = uniqueId;

          if (uniqueId) {
            // Registration was pre-saved, just confirm it
            try {
              await updateRegistrationStatus(uniqueId, 'Confirmed');
              if (!existingReg) {
                await updatePaymentReference(uniqueId, reference);
              }
            } catch (err) {
              console.error(`[Callback] Failed to confirm registration ${uniqueId}:`, err);
            }
          } else if (registrationData) {
            // Fallback: registration not pre-saved (old flow / edge case)
            try {
              finalUniqueId = await appendRegistration({ ...registrationData, paymentReference: reference });
              await updateRegistrationStatus(finalUniqueId, 'Confirmed');
            } catch (err) {
              console.error('[Callback] Failed to create registration:', err);
              redirectUrl = isAdminPayment
                ? `/admin/paystack-payments?status=error&message=RegistrationSaveFailed`
                : `/?status=error&message=RegistrationSaveFailed`;
              break;
            }
          } else {
            redirectUrl = isAdminPayment
              ? `/admin/paystack-payments?status=error&message=MissingRegistrationData`
              : `/?status=error&message=MissingRegistrationData`;
            break;
          }

          // --- SEND EMAIL (non-blocking: failures don't break the redirect) ---
          if (finalUniqueId && registrationData) {
            try {
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
              const scanUrl = `${baseUrl}/admin/users/${finalUniqueId}`;
              const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
                width: 300,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
              });

              await sendRegistrationEmail(
                registrationData.email,
                registrationData.fullName,
                finalUniqueId,
                reference,
                qrCodeDataUrl
              );
            } catch (emailErr) {
              // Email failure is NOT fatal — user is still registered
              console.error(`[Callback] Email/QR failed for ${finalUniqueId}, but registration is confirmed:`, emailErr);
            }
          }

          redirectUrl = isAdminPayment
            ? `/admin/paystack-payments?status=success&uniqueId=${finalUniqueId}`
            : `/?status=success&uniqueId=${finalUniqueId}`;
        }
        break;
      }
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Callback error:', error);
    const errUrl = isAdminPayment
      ? `/admin/paystack-payments?status=error&message=CallbackError&reference=${reference}`
      : `/?status=error&message=CallbackError&reference=${reference}`;
    return NextResponse.redirect(new URL(errUrl, request.url));
  }
}
