import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { appendRegistration, updateRegistrationStatus } from '@/lib/registrationService';
import { sendRegistrationEmail } from '@/lib/email';
import * as QRCode from 'qrcode';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const typeFromQuery = searchParams.get('type') as 'registration' | 'store' | undefined;
    const data = await verifyTransaction(reference, typeFromQuery);

    if (data.status !== 'success') {
      console.warn(`Payment not successful. Reference: ${reference}, Status: ${data.status}`);
      return NextResponse.redirect(new URL('/?status=error&message=PaymentNotSuccessful', request.url));
    }

    const type = data.metadata?.transaction_type;
    const registrationData = data.metadata?.registrationData;

    let redirectUrl = '/';
    switch (type) {
      case 'store':
        redirectUrl = `/store/order-success?orderId=${reference}&clearCart=true`;
        break;
      case 'registration':
        if (registrationData) {
          // Add registration details and get unique ID
          const uniqueId = await appendRegistration(registrationData);
          
          // Mark as Confirmed immediately since payment was verified
          await updateRegistrationStatus(uniqueId, 'Confirmed');

          // Generate QR code (encode the link to the admin scanner)
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const scanUrl = `${baseUrl}/admin/scanner?id=${uniqueId}`;
          const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });

          // Send confirmation email with QR and reference
          await sendRegistrationEmail(
            registrationData.email,
            registrationData.fullName,
            uniqueId,
            reference,
            qrCodeDataUrl
          );

          // Return back to registration page with success
          redirectUrl = `/?status=success&uniqueId=${uniqueId}`;
        } else {
          redirectUrl = `/?status=error&message=MissingRegistrationData`;
        }
        break;
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/?status=error', request.url));
  }
}
