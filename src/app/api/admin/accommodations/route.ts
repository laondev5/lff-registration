import { NextRequest, NextResponse } from 'next/server';
import {
    getAccommodations,
    addAccommodation,
    updateAccommodationListing,
    deleteAccommodationListing
} from '@/lib/googleSheets';
import { uploadFile, deleteFile } from '@/lib/googleDrive';
import { isAuthenticated, unauthorizedResponse } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
    // Public or protected? Probably protected for now, but maybe public if we want to show them on frontend?
    // Requirement says "admin will be able to upload...". 
    // Usually accommodations are public for users to see, but this specific ID might be admin focused.
    // Let's keep it protected for admin management, and maybe another public endpoint or reuse this if needed.
    // Actually, users need to see accommodations to book them. So GET should probably be public?
    // But the requirement implies this is the admin CRUD.
    // Let's make GET public so the main form can use it too if we switch to dynamic accommodations.
    // But for now, let's just protect it as per "Admin Dashboard" task. 
    // Wait, if I protect it, users can't see it (if I were to use this API for the frontend).
    // The current frontend uses hardcoded data presumably or hasn't implemented dynamic fetching yet.
    // I will protect it for now.

    if (!(await isAuthenticated())) {
        return unauthorizedResponse();
    }

    try {
        const accommodations = await getAccommodations();
        return NextResponse.json(accommodations);
    } catch (error) {
        console.error("Error fetching accommodations:", error);
        return NextResponse.json({ error: "Failed to fetch accommodations" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return unauthorizedResponse();
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const price = formData.get('price') as string;
        const slots = formData.get('slots') as string;

        if (!title || !price) {
            return NextResponse.json({ error: "Missing required fields (title, price)" }, { status: 400 });
        }

        // Image handling: prioritize provided URL, then try file upload
        const providedImageUrl = formData.get('imageUrl') as string;
        let imageUrl = providedImageUrl || '';
        let fileId = '';

        if (!imageUrl && file) {
            try {
                const driveFile = await uploadFile(file);
                fileId = driveFile.id || '';
                imageUrl = driveFile.webViewLink || '';
                if (driveFile.thumbnailLink) {
                    imageUrl = driveFile.thumbnailLink.replace('=s220', '=s1000');
                }
            } catch (uploadError) {
                console.warn("Image upload failed, using placeholder:", uploadError);
                imageUrl = "https://placehold.co/600x400?text=No+Image";
            }
        }

        if (!imageUrl) {
            imageUrl = "https://placehold.co/600x400?text=No+Image";
        }

        // Add to Sheet
        const accommodationData = {
            title,
            description: description || '',
            price,
            slots,
            imageUrl,
            fileId
        };

        const id = await addAccommodation(accommodationData);

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error("Error creating accommodation:", error);
        return NextResponse.json({ error: "Failed to create accommodation" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return unauthorizedResponse();
    }

    try {
        const formData = await request.formData();
        const id = formData.get('id') as string;
        const file = formData.get('file') as File | null;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const updates: any = {};
        if (formData.has('title')) updates.title = formData.get('title');
        if (formData.has('description')) updates.description = formData.get('description');
        if (formData.has('price')) updates.price = formData.get('price');
        if (formData.has('slots')) updates.slots = formData.get('slots');

        if (file) {
            // Upload new file
            const driveFile = await uploadFile(file);
            // Hack for higher res thumbnail
            updates.imageUrl = driveFile.thumbnailLink
                ? driveFile.thumbnailLink.replace('=s220', '=s1000')
                : driveFile.webViewLink;
            updates.fileId = driveFile.id;

            // Should we delete the old file? 
            // We'd need to fetch the old details first. 
            // For now, let's rely on the user manually cleaning up or just ignore it 
            // OR ideally we fetch the old record to get the old fileId.
            // The `updateAccommodationListing` doesn't return the old one.
            // Let's fetch it here if we want to be clean.

            const accommodations = await getAccommodations();
            const current = accommodations.find(acc => acc.id === id);
            if (current && current.fileId) {
                await deleteFile(current.fileId); // Delete old file
            }
        }

        await updateAccommodationListing(id, updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating accommodation:", error);
        return NextResponse.json({ error: "Failed to update accommodation" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return unauthorizedResponse();
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        // Fetch to get fileId for deletion
        const accommodations = await getAccommodations();
        const current = accommodations.find(acc => acc.id === id);

        if (current && current.fileId) {
            await deleteFile(current.fileId);
        }

        await deleteAccommodationListing(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting accommodation:", error);
        return NextResponse.json({ error: "Failed to delete accommodation" }, { status: 500 });
    }
}
