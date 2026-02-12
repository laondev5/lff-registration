
import { NextResponse } from 'next/server';
import { getAccommodations } from '@/lib/googleSheets';

export async function GET() {
    try {
        const accommodations = await getAccommodations();
        return NextResponse.json({ success: true, accommodations });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
