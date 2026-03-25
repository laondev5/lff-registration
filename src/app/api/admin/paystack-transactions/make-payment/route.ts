import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Registration from '@/models/Registration';
import { initializeTransaction } from '@/lib/paystack';
import { isAuthenticated, unauthorizedResponse } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return unauthorizedResponse();
  }

  try {
    const { email, amount, uniqueId, fullName, reference: originalReference, isBulk } =
      await request.json();

    if (!email || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, amount' },
        { status: 400 }
      );
    }

    await connectDB();

    const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    // callback carries type + admin flag so the callback route redirects back here
    const callbackUrl = `${origin}/api/paystack/callback?type=registration&admin=true`;

    if (isBulk && originalReference) {
      // ── BULK ──────────────────────────────────────────────────────────────
      const bulkRegs = await Registration.find({ paymentReference: originalReference }).lean();
      if (!bulkRegs || bulkRegs.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No registrations found for this bulk reference.' },
          { status: 404 }
        );
      }

      const uniqueIds = bulkRegs.map((r: any) => r.uniqueId);
      const registrationDataList = bulkRegs.map((r: any) => ({
        uniqueId: r.uniqueId,
        fullName: r.fullName,
        email: r.email,
      }));

      const transaction = await initializeTransaction({
        email,
        amount,
        callback_url: callbackUrl,
        subaccount: process.env.PAYSTACK_REGISTRATION_SUBACCOUNT || '',
        type: 'registration',
        metadata: {
          transaction_type: 'registration',
          isBulk: true,
          uniqueIds,
          registrationDataList,
          adminInitiated: true,
        },
      });

      // Update all bulk registrations to point to the new reference
      await Registration.updateMany(
        { paymentReference: originalReference },
        { paymentReference: transaction.reference }
      );

      return NextResponse.json({
        success: true,
        authorizationUrl: transaction.authorization_url,
        reference: transaction.reference,
      });
    } else {
      // ── SINGLE ────────────────────────────────────────────────────────────
      if (!uniqueId) {
        return NextResponse.json(
          { success: false, error: 'Missing uniqueId for single registration.' },
          { status: 400 }
        );
      }

      const reg = await Registration.findOne({ uniqueId });
      if (!reg) {
        return NextResponse.json(
          { success: false, error: 'Registration not found. The user may have been deleted.' },
          { status: 404 }
        );
      }

      const transaction = await initializeTransaction({
        email,
        amount,
        callback_url: callbackUrl,
        subaccount: process.env.PAYSTACK_REGISTRATION_SUBACCOUNT || '',
        type: 'registration',
        metadata: {
          transaction_type: 'registration',
          uniqueId,
          registrationData: {
            uniqueId,
            fullName: fullName || reg.fullName,
            email,
          },
          adminInitiated: true,
        },
      });

      // Update registration to point to the new reference
      await Registration.updateOne(
        { uniqueId },
        { paymentReference: transaction.reference }
      );

      return NextResponse.json({
        success: true,
        authorizationUrl: transaction.authorization_url,
        reference: transaction.reference,
      });
    }
  } catch (error) {
    console.error('[Make Payment] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
