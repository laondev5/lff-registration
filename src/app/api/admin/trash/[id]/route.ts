import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TrashedRegistration from '@/models/TrashedRegistration';
import Registration from '@/models/Registration';

// POST /api/admin/trash/[id] — restore a trashed registration back to active
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const trashed = await TrashedRegistration.findOne({ uniqueId: id });
    if (!trashed) {
      return NextResponse.json({ success: false, error: 'Record not found in trash' }, { status: 404 });
    }

    // Check if a registration with this uniqueId already exists (edge case)
    const existing = await Registration.findOne({ uniqueId: id });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A registration with this ID already exists.' },
        { status: 409 }
      );
    }

    const obj = trashed.toObject();
    // Strip trash-specific fields
    delete obj._id;
    delete obj.__v;
    delete obj.trashedAt;
    delete obj.trashedFrom;
    delete obj.reRegisterEmailSent;

    await Registration.create(obj);
    await TrashedRegistration.deleteOne({ uniqueId: id });

    return NextResponse.json({
      success: true,
      message: `${trashed.fullName}'s registration has been restored.`,
    });
  } catch (error) {
    console.error('[Trash] Restore error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/trash/[id] — permanently remove from trash
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const trashed = await TrashedRegistration.findOneAndDelete({ uniqueId: id });
    if (!trashed) {
      return NextResponse.json({ success: false, error: 'Record not found in trash' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `${trashed.fullName}'s record has been permanently deleted.`,
    });
  } catch (error) {
    console.error('[Trash] Permanent delete error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
