import { NextRequest, NextResponse } from 'next/server';
import { getAccommodationsWithAvailability, getAccommodationsForUser } from '@/lib/accommodationService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tagsParam = searchParams.get('tags');
        
        let accommodations;
        
        if (tagsParam) {
            const tags = tagsParam.split(',').map(t => t.trim()).filter(Boolean);
            accommodations = await getAccommodationsForUser(tags);
        } else {
            accommodations = await getAccommodationsWithAvailability();
        }
        
        return NextResponse.json({ success: true, accommodations });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
