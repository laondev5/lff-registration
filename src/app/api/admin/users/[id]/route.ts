import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Registration from '@/models/Registration';
import { sendRegistrationEmail } from '@/lib/email';
import * as QRCode from 'qrcode';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();

        const reg = await Registration.findOne({ uniqueId: id });
        if (!reg) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        if (reg.registrationStatus === 'Confirmed') {
            return NextResponse.json({ success: false, error: 'Registration is already confirmed.' }, { status: 400 });
        }

        reg.registrationStatus = 'Confirmed';
        await reg.save();

        // Send confirmation email with unique ID
        await sendRegistrationEmail(
            reg.email,
            reg.fullName,
            reg.uniqueId,
            reg.paymentReference || 'Manual Confirmation'
        );

        return NextResponse.json({
            success: true,
            message: `Registration for ${reg.fullName} confirmed and email sent.`,
        });
    } catch (error: any) {
        console.error('Confirm registration error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();

        const reg = await Registration.findOne({ uniqueId: id });
        if (!reg) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        if (reg.registrationStatus !== 'Confirmed') {
            return NextResponse.json({ success: false, error: 'Only confirmed registrations can have their email resent.' }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const scanUrl = `${baseUrl}/admin/users/${reg.uniqueId}`;
        const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
            width: 300, margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        });

        await sendRegistrationEmail(
            reg.email,
            reg.fullName,
            reg.uniqueId,
            reg.paymentReference || 'Manual Confirmation',
            qrCodeDataUrl
        );

        return NextResponse.json({
            success: true,
            message: `Confirmation email resent to ${reg.email}.`,
        });
    } catch (error: any) {
        console.error('Resend email error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

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
