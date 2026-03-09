import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { findAllByPaymentReference, updateRegistrationStatus, findUserByEmailOrPhone, updatePaymentReference } from '@/lib/registrationService';
import { sendRegistrationEmail } from '@/lib/email';
import * as QRCode from 'qrcode';
import { connectDB } from '@/lib/mongodb';
import Registration from '@/models/Registration';

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
    // 1. Check if ANY records exist in our DB for this reference (Single or Bulk)
    const existingRegs = await findAllByPaymentReference(reference);
    
    if (existingRegs && existingRegs.length > 0) {
      // Check if any need confirmation
      const pendingRegs = existingRegs.filter((reg: any) => reg.registrationStatus !== 'Confirmed');

      if (pendingRegs.length === 0) {
        // All existing are already confirmed
        return NextResponse.json({
          success: true,
          alreadyProcessed: true,
          message: 'This payment has already been confirmed.',
          data: {
            uniqueId: existingRegs[0].uniqueId,
            fullName: existingRegs[0].fullName,
            status: 'Confirmed',
          }
        });
      } else {
        // We found pending registrations. Let's auto-confirm them!
        const confirmedIds = [];
        for (const reg of pendingRegs) {
          await updateRegistrationStatus(reg.uniqueId, 'Confirmed');
          
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const scanUrl = `${baseUrl}/admin/users/${reg.uniqueId}`;
            const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
              width: 300, margin: 2,
              color: { dark: '#000000', light: '#ffffff' }
            });
            await sendRegistrationEmail(reg.email, reg.fullName, reg.uniqueId, reference, qrCodeDataUrl);
          } catch (emailErr) {
            console.error('[Fetch Metadata] Email failed during auto-confirm:', emailErr);
          }
          confirmedIds.push(reg.uniqueId);
        }

        return NextResponse.json({
          success: true,
          autoConfirmed: true,
          message: 'We found your pending registration and confirmed it!',
          data: {
            uniqueIds: confirmedIds,
            status: 'Confirmed'
          }
        });
      }
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

    // 3. Since reference search failed or was incomplete, check by email from Paystack data
    const paystackEmail = paystackData.customer?.email || (paystackData.metadata && paystackData.metadata.email);
    
    if (paystackEmail) {
      await connectDB();
      // Check for users with this email
      const usersByEmail = await Registration.find({ email: new RegExp('^' + paystackEmail + '$', 'i') }).lean();
      
      const pendingUsers = usersByEmail.filter((u: any) => u.registrationStatus !== 'Confirmed');
      
      if (usersByEmail.length > 0 && pendingUsers.length === 0) {
          // Found users with this email, and they are ALL confirmed
          return NextResponse.json({
            success: true,
            alreadyProcessed: true,
            message: 'A registration with this email is already confirmed.',
            data: {
              uniqueId: usersByEmail[0].uniqueId,
              fullName: usersByEmail[0].fullName,
              status: 'Confirmed',
            }
          });
      }

      if (pendingUsers.length > 0) {
        // We found pending users by email! Let's auto-confirm them!
        const confirmedIds = [];
        for (const reg of pendingUsers) {
          await updateRegistrationStatus(reg.uniqueId, 'Confirmed');
          await updatePaymentReference(reg.uniqueId, reference);
          
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const scanUrl = `${baseUrl}/admin/users/${reg.uniqueId}`;
            const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
              width: 300, margin: 2,
              color: { dark: '#000000', light: '#ffffff' }
            });
            await sendRegistrationEmail(reg.email, reg.fullName, reg.uniqueId, reference, qrCodeDataUrl);
          } catch (emailErr) {
            console.error('[Fetch Metadata] Email failed during auto-confirm by email:', emailErr);
          }
          confirmedIds.push(reg.uniqueId);
        }

        return NextResponse.json({
          success: true,
          autoConfirmed: true,
          message: 'We found your pending registration by email and confirmed it!',
          data: {
            uniqueIds: confirmedIds,
            status: 'Confirmed'
          }
        });
      }
    }

    // 4. Return the metadata without saving to DB yet (Let them redirect)
    return NextResponse.json({
      success: true,
      recovered: false, // It's not recovered into the DB yet
      message: 'Payment found on Paystack. Redirecting to registration...',
      metadata: paystackData.metadata || {},
      paystackCustomerEmail: paystackData.customer?.email || '',
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
