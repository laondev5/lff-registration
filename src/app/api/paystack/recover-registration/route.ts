import { NextResponse } from 'next/server';
import { 
  appendRegistration, 
  updatePaymentReference,
  findByPaymentReference,
  getUserById,
  updateRegistrationStatus
} from '@/lib/registrationService';
import { sendRegistrationEmail } from '@/lib/email';
import * as QRCode from 'qrcode';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference, registrationData } = body;

    if (!reference || !registrationData) {
      return NextResponse.json(
        { success: false, error: 'Missing reference or registration data' },
        { status: 400 }
      );
    }

    // 1. Double-check if it's already processed to prevent duplicates
    const existingRegByRef = await findByPaymentReference(reference);
    if (existingRegByRef && existingRegByRef.registrationStatus === 'Confirmed') {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: 'This payment has already been securely processed.',
        data: { uniqueId: existingRegByRef.uniqueId }
      });
    }

    // Check if uniqueId was passed (meaning the user exists but wasn't confirmed properly)
    if (registrationData.uniqueId) {
      const existingUser = await getUserById(registrationData.uniqueId);
      if (existingUser) {
        // Just update status and reference
        await updateRegistrationStatus(registrationData.uniqueId, 'Confirmed');
        await updatePaymentReference(registrationData.uniqueId, reference);
        
        // Try to send email
        await trySendEmail(existingUser.email, existingUser.fullName || registrationData.fullName, registrationData.uniqueId, reference);

        return NextResponse.json({
          success: true,
          recovered: true,
          message: 'Registration confirmed successfully!',
          data: { uniqueId: registrationData.uniqueId }
        });
      }
    }

    // 2. Create new registration entry
    const newUniqueId = await appendRegistration({
      ...registrationData,
      registrationStatus: 'Confirmed',
      paymentReference: reference,
    });
    
    // Ensure the reference is explicitly recorded 
    await updatePaymentReference(newUniqueId, reference);

    // 3. Send Email
    await trySendEmail(registrationData.email, registrationData.fullName, newUniqueId, reference);

    return NextResponse.json({
      success: true,
      recovered: true,
      message: 'Registration has been saved and confirmed!',
      data: { uniqueId: newUniqueId }
    });

  } catch (error: any) {
    console.error('[Recover Registration] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save registration data' },
      { status: 500 }
    );
  }
}

async function trySendEmail(email: string, fullName: string, uniqueId: string, reference: string) {
  if (!email) return;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const scanUrl = `${baseUrl}/admin/users/${uniqueId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
      width: 300, margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
    
    await sendRegistrationEmail(
      email, 
      fullName || '', 
      uniqueId, 
      reference, 
      qrCodeDataUrl
    );
  } catch (emailErr) {
    console.error('[Recover Registration] Email failed but registration saved:', emailErr);
  }
}
