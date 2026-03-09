import { NextResponse } from 'next/server';
import { 
  appendRegistration, 
  updatePaymentReference,
  findAllByPaymentReference,
  getUserById,
  updateRegistrationStatus
} from '@/lib/registrationService';
import { sendRegistrationEmail } from '@/lib/email';
import * as QRCode from 'qrcode';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference, registrationData, registrationDataList } = body;

    if (!reference || (!registrationData && !registrationDataList)) {
      return NextResponse.json(
        { success: false, error: 'Missing reference or registration data' },
        { status: 400 }
      );
    }

    // 1. Double-check if it's already processed to prevent duplicates
    const existingRegsByRef = await findAllByPaymentReference(reference);
    if (existingRegsByRef && existingRegsByRef.length > 0 && existingRegsByRef.some((r: any) => r.registrationStatus === 'Confirmed')) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: 'This payment has already been securely processed.',
        data: { uniqueId: existingRegsByRef[0].uniqueId }
      });
    }

    // Prepare list of registrations to process
    const regsToProcess = registrationDataList || [registrationData];
    const generatedIds: string[] = [];

    for (const dataItem of regsToProcess) {
      if (!dataItem) continue;
      
      let finalUniqueId = null;

      // Check if uniqueId was passed (meaning the user exists but wasn't confirmed properly)
      if (dataItem.uniqueId) {
        const existingUser = await getUserById(dataItem.uniqueId);
        if (existingUser) {
          // Just update status and reference
          await updateRegistrationStatus(dataItem.uniqueId, 'Confirmed');
          await updatePaymentReference(dataItem.uniqueId, reference);
          finalUniqueId = dataItem.uniqueId;
        }
      }

      if (!finalUniqueId) {
        // 2. Create new registration entry
        finalUniqueId = await appendRegistration({
          ...dataItem,
          registrationStatus: 'Confirmed',
          paymentReference: reference,
        });
        
        // Ensure the reference is explicitly recorded 
        await updatePaymentReference(finalUniqueId, reference);
      }

      generatedIds.push(finalUniqueId);

      // 3. Send Email
      await trySendEmail(dataItem.email, dataItem.fullName, finalUniqueId, reference);
    }

    return NextResponse.json({
      success: true,
      recovered: true,
      message: registrationDataList ? 'Bulk registrations recovered and confirmed!' : 'Registration has been saved and confirmed!',
      data: { 
        uniqueId: generatedIds[0],
        uniqueIds: generatedIds 
      }
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
