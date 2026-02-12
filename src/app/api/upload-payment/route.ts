
import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentProof } from '@/lib/googleSheets';
import { uploadFile } from '@/lib/googleDrive';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const uniqueId = formData.get('uniqueId') as string;

        if (!file || !uniqueId) {
            return NextResponse.json({ success: false, error: 'Missing file or unique ID' }, { status: 400 });
        }

        // Upload to Google Drive
        const googleFile = await uploadFile(file);
        const fileLink = googleFile.webViewLink;

        if (!fileLink) {
            throw new Error("Failed to get file link from Google Drive");
        }

        // Update Google Sheet with the link
        await updatePaymentProof(uniqueId, fileLink);

        return NextResponse.json({ success: true, fileLink });
    } catch (error: any) {
        console.error("Payment upload error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
