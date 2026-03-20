import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Registration from '@/models/Registration';
import TrashedRegistration from '@/models/TrashedRegistration';
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

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { email } = await request.json();

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json({ success: false, error: 'Invalid email address.' }, { status: 400 });
        }

        await connectDB();
        const reg = await Registration.findOneAndUpdate(
            { uniqueId: id },
            { email: email.trim().toLowerCase() },
            { new: true }
        );

        if (!reg) {
            return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Email updated to ${email.trim()}.` });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Update email error:', error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await connectDB();

        const reg = await Registration.findOne({ uniqueId: id });

        if (!reg) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Move to trash (soft delete) — removes from Registration so it no longer
        // counts in stats or accommodations, but is recoverable from the trash page.
        await TrashedRegistration.findOneAndUpdate(
            { uniqueId: reg.uniqueId },
            {
                ...reg.toObject(),
                trashedAt: new Date(),
                trashedFrom: 'users',
                reRegisterEmailSent: false,
            },
            { upsert: true, new: true }
        );

        await Registration.deleteOne({ uniqueId: id });

        return NextResponse.json({
            success: true,
            message: 'Registration moved to trash. Accommodation slot has been freed.',
            deletedUser: {
                uniqueId: reg.uniqueId,
                fullName: reg.fullName,
                accommodationType: reg.accommodationType,
                needsAccommodation: reg.needsAccommodation,
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
