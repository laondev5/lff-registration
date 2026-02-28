import { NextResponse } from 'next/server';
import { getUserById } from '@/lib/googleSheets';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'Registration ID is required' }, { status: 400 });
  }

  try {
    const user = await getUserById(id);

    if (user) {
      return NextResponse.json({ 
        success: true, 
        user: {
          uniqueId: user.uniqueId,
          title: user.title,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          churchDetails: user.churchDetails,
          attendanceType: user.attendanceType,
          registrationStatus: user.registrationStatus,
        }
      });
    } else {
      return NextResponse.json({ success: false, error: 'Registration not found' }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
