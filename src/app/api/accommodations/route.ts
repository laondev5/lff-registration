import { NextResponse } from 'next/server';
import { getAccommodationsWithAvailability } from '@/lib/accommodationService';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const accommodations = await getAccommodationsWithAvailability();
        return NextResponse.json({ success: true, accommodations });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
