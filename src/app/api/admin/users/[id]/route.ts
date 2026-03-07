import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Registration from '@/models/Registration';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await connectDB();

        // Find and delete the registration
        const deletedUser = await Registration.findOneAndDelete({ uniqueId: id });

        if (!deletedUser) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // The accommodation slot is automatically freed because
        // getAccommodationsWithAvailability() counts registrations dynamically.
        // By deleting this registration, the count decreases and the slot opens up.

        return NextResponse.json({
            success: true,
            message: 'Registration deleted successfully. Accommodation slot has been freed.',
            deletedUser: {
                uniqueId: deletedUser.uniqueId,
                fullName: deletedUser.fullName,
                accommodationType: deletedUser.accommodationType,
                needsAccommodation: deletedUser.needsAccommodation,
            }
        });
    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
