import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TrashedRegistration from '@/models/TrashedRegistration';

export async function GET() {
  try {
    await connectDB();
    const trashed = await TrashedRegistration.find().sort({ trashedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: trashed });
  } catch (error) {
    console.error('[Trash] GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
