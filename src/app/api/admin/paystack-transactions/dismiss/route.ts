import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Registration from '@/models/Registration';
import TrashedRegistration from '@/models/TrashedRegistration';
import DismissedTransaction from '@/models/DismissedTransaction';
import { sendReRegisterEmail } from '@/lib/email';

interface EntryInput {
  reference: string;
  email: string;
  name: string;
  uniqueId?: string | null;
  isBulk?: boolean;
  bulkEmails?: Array<{ email: string; name: string }>;
}

async function moveToTrash(reg: any, emailSent: boolean) {
  await TrashedRegistration.findOneAndUpdate(
    { uniqueId: reg.uniqueId },
    {
      ...(reg.toObject ? reg.toObject() : reg),
      trashedAt: new Date(),
      trashedFrom: 'paystack-payments',
      reRegisterEmailSent: emailSent,
    },
    { upsert: true, new: true }
  );
  await Registration.deleteOne({ uniqueId: reg.uniqueId });
}

export async function POST(request: NextRequest) {
  try {
    const { action, entries }: { action: 'email' | 'delete'; entries: EntryInput[] } =
      await request.json();

    if (!entries || entries.length === 0) {
      return NextResponse.json({ success: false, error: 'No entries provided' }, { status: 400 });
    }

    await connectDB();

    let emailsSent = 0;
    let trashedCount = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        // Determine all recipients
        const recipients: Array<{ email: string; name: string }> =
          entry.bulkEmails && entry.bulkEmails.length > 0
            ? entry.bulkEmails
            : [{ email: entry.email, name: entry.name }];

        // Send re-register email to all recipients
        let entrySentEmail = false;
        for (const recipient of recipients) {
          if (recipient.email) {
            const sent = await sendReRegisterEmail(recipient.email, recipient.name);
            if (sent) { emailsSent++; entrySentEmail = true; }
          }
        }

        if (action === 'delete') {
          // Move individual registration to trash
          if (entry.uniqueId) {
            const reg = await Registration.findOne({ uniqueId: entry.uniqueId });
            if (reg) {
              await moveToTrash(reg, entrySentEmail);
              trashedCount++;
            }
          }

          // For bulk registrations, move all registrations with this payment reference to trash
          if (entry.isBulk && entry.reference) {
            const bulkRegs = await Registration.find({ paymentReference: entry.reference });
            for (const reg of bulkRegs) {
              await moveToTrash(reg, entrySentEmail);
              trashedCount++;
            }
          }

          // Mark the Paystack reference as dismissed so it no longer appears in the admin list
          try {
            await DismissedTransaction.findOneAndUpdate(
              { reference: entry.reference },
              { reference: entry.reference },
              { upsert: true }
            );
          } catch {
            // Ignore duplicate key errors (already dismissed)
          }
        }
      } catch (entryError) {
        errors.push(
          `Failed for ${entry.reference}: ${entryError instanceof Error ? entryError.message : 'Unknown error'}`
        );
      }
    }

    const message =
      action === 'delete'
        ? `${trashedCount} record(s) moved to trash and ${emailsSent} re-registration email(s) sent.`
        : `${emailsSent} re-registration email(s) sent.`;

    return NextResponse.json({
      success: true,
      message,
      emailsSent,
      trashedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Dismiss Transactions] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
