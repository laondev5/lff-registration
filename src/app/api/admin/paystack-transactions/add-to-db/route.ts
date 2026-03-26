import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Registration from '@/models/Registration';
import { isAuthenticated, unauthorizedResponse } from '@/lib/adminAuth';
import { sendRegistrationEmail } from '@/lib/email';

interface BulkPerson {
  email: string;
  fullName: string;
  title?: string;
}

interface EntryToAdd {
  reference: string;
  email: string;
  fullName: string;
  uniqueId?: string | null;
  amount: number;
  isBulk: boolean;
  bulkRegistrations?: BulkPerson[] | null;
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return unauthorizedResponse();
  }

  try {
    const { entries }: { entries: EntryToAdd[] } = await request.json();

    if (!entries || entries.length === 0) {
      return NextResponse.json({ success: false, error: 'No entries provided' }, { status: 400 });
    }

    await connectDB();

    let addedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        if (entry.isBulk && entry.bulkRegistrations && entry.bulkRegistrations.length > 0) {
          // Bulk — create one Registration per person in the list
          for (const person of entry.bulkRegistrations) {
            // Skip if this person already has a registration under this reference
            const existing = await Registration.findOne({
              email: person.email.toLowerCase().trim(),
              paymentReference: entry.reference,
            });

            if (existing) {
              skippedCount++;
              continue;
            }

            const uniqueId = `LFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            await Registration.create({
              uniqueId,
              title: person.title || '',
              fullName: person.fullName || 'Unknown',
              email: (person.email || '').toLowerCase().trim(),
              paymentReference: entry.reference,
              registrationStatus: 'Confirmed',
              registrationAmount: String(entry.amount),
            });

            try {
              await sendRegistrationEmail(person.email, person.fullName, uniqueId, entry.reference);
            } catch (emailErr) {
              console.warn('[Add to DB] Confirmation email failed for', person.email, emailErr);
            }

            addedCount++;
          }
        } else {
          // Single — create one Registration
          const existingByRef = await Registration.findOne({ paymentReference: entry.reference });
          const existingByUid = entry.uniqueId
            ? await Registration.findOne({ uniqueId: entry.uniqueId })
            : null;

          if (existingByRef || existingByUid) {
            skippedCount++;
            continue;
          }

          const uniqueId =
            entry.uniqueId || `LFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          await Registration.create({
            uniqueId,
            fullName: entry.fullName || 'Unknown',
            email: (entry.email || '').toLowerCase().trim(),
            paymentReference: entry.reference,
            registrationStatus: 'Confirmed',
            registrationAmount: String(entry.amount),
          });

          try {
            await sendRegistrationEmail(entry.email, entry.fullName, uniqueId, entry.reference);
          } catch (emailErr) {
            console.warn('[Add to DB] Confirmation email failed for', entry.email, emailErr);
          }

          addedCount++;
        }
      } catch (entryError) {
        errors.push(
          `Failed for ${entry.reference}: ${
            entryError instanceof Error ? entryError.message : 'Unknown error'
          }`
        );
      }
    }

    const skippedNote = skippedCount > 0 ? ` ${skippedCount} already existed and were skipped.` : '';
    return NextResponse.json({
      success: true,
      message: `${addedCount} registration(s) added to the database and confirmation email(s) sent.${skippedNote}`,
      addedCount,
      skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Add to DB] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
