import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Registration from '@/models/Registration';
import { isAuthenticated, unauthorizedResponse } from '@/lib/adminAuth';
import { sendRegistrationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return unauthorizedResponse();
  }

  try {
    const { uniqueIds }: { uniqueIds: string[] } = await request.json();

    if (!uniqueIds || uniqueIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No IDs provided' }, { status: 400 });
    }

    await connectDB();

    let confirmedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const uniqueId of uniqueIds) {
      try {
        const reg = await Registration.findOne({ uniqueId });

        if (!reg) {
          errors.push(`${uniqueId}: not found`);
          continue;
        }

        if (reg.registrationStatus === 'Confirmed') {
          skippedCount++;
          continue;
        }

        reg.registrationStatus = 'Confirmed';
        await reg.save();

        try {
          await sendRegistrationEmail(
            reg.email,
            reg.fullName,
            reg.uniqueId,
            reg.paymentReference || 'Manual Confirmation'
          );
        } catch (emailErr) {
          console.warn('[Bulk Confirm] Email failed for', reg.email, emailErr);
        }

        confirmedCount++;
      } catch (err) {
        errors.push(
          `${uniqueId}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    const skippedNote = skippedCount > 0 ? ` ${skippedCount} already confirmed.` : '';
    return NextResponse.json({
      success: true,
      message: `${confirmedCount} registration(s) confirmed and emails sent.${skippedNote}`,
      confirmedCount,
      skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Bulk Confirm] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
