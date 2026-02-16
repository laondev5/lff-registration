import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentProof } from '@/lib/googleSheets';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const uniqueId = formData.get('uniqueId') as string;
        const type = (formData.get('type') as string) || 'accommodation';

        if (!file || !uniqueId) {
            return NextResponse.json({ success: false, error: 'Missing file or unique ID' }, { status: 400 });
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, 'lff-payment-proofs');
        const fileLink = result.url;

        // Update Google Sheet with the Cloudinary link
        await updatePaymentProof(uniqueId, fileLink, type as 'registration' | 'accommodation');

        return NextResponse.json({ success: true, fileLink });
    } catch (error: any) {
        console.error("Payment upload error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
