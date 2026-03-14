import mongoose from 'mongoose';
import { connectDB } from './mongodb';
import Registration from '@/models/Registration';
import {
    appendRegistration as sheetsAppendRegistration,
    updateAccommodation as sheetsUpdateAccommodation,
    updatePaymentProof as sheetsUpdatePaymentProof,
    updateUserDepartment as sheetsUpdateUserDepartment,
    updateRegistrationStatus as sheetsUpdateRegistrationStatus
} from './googleSheets';

function formatRegistration(r: any) {
    return {
        uniqueId: r.uniqueId,
        title: r.title,
        fullName: r.fullName,
        email: r.email,
        phoneNumber: r.phoneNumber,
        whatsapp: r.whatsapp,
        gender: r.gender,
        isLFFMember: r.isLFFMember,
        churchDetails: r.churchDetails,
        areaDistrict: r.areaDistrict,
        state: r.state,
        country: r.country,
        attendanceType: r.attendanceType,
        busInterest: r.busInterest,
        mealCollection: r.mealCollection,
        prayerRequest: r.prayerRequest,
        registrationType: r.registrationType,
        registrationAmount: r.registrationAmount,
        registrationPaymentProof: r.registrationPaymentProof,
        needsAccommodation: r.needsAccommodation,
        accommodationType: r.accommodationType,
        price: r.price,
        duration: r.duration,
        paymentProof: r.paymentProof,
        departmentStatus: r.departmentStatus,
        department: r.department,
        subDepartment: r.subDepartment,
        registrationStatus: r.registrationStatus,
        paymentReference: r.paymentReference || '',
        createdAt: r.createdAt?.toISOString?.() || r.createdAt,
    };
}

export async function getUsers() {
    await connectDB();
    const users = await Registration.find().sort({ createdAt: -1 }).lean();
    return users.map((u: any) => formatRegistration(u));
}

export async function getUserById(uniqueId: string) {
    await connectDB();
    const user = await Registration.findOne({ uniqueId }).lean();
    if (!user) return null;
    return formatRegistration(user);
}

export async function appendRegistration(data: any) {
    await connectDB();
    const uniqueId = `LFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const reg = await Registration.create({
        uniqueId,
        title: data.title || '',
        fullName: data.fullName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        whatsapp: data.whatsapp || '',
        gender: data.gender || '',
        isLFFMember: data.isLFFMember || '',
        churchDetails: data.churchDetails || '',
        areaDistrict: data.areaDistrict || '',
        state: data.state || '',
        country: data.country || '',
        attendanceType: data.attendanceType || '',
        busInterest: data.busInterest || '',
        mealCollection: data.mealCollection || '',
        prayerRequest: data.prayerRequest || '',
        registrationType: data.registrationType || '',
        registrationAmount: data.registrationAmount || '',
        registrationPaymentProof: '',
        needsAccommodation: data.needsAccommodation ? 'Yes' : 'No',
        accommodationType: (data.accommodationType || '').trim(),
        price: data.accommodationPrice || '',
        duration: data.duration || '',
        paymentProof: '',
        departmentStatus: '',
        department: '',
        subDepartment: '',
        registrationStatus: 'Pending',
        paymentReference: data.paymentReference || '',
    });

    try {
        const sheetId = await sheetsAppendRegistration(data, uniqueId);
        reg.sheetId = sheetId;
        await reg.save();
    } catch (err) {
        console.warn('Google Sheets sync failed for appendRegistration:', err);
    }
    
    return uniqueId;
}

export async function updateAccommodation(uniqueId: string, accommodationData: any) {
    await connectDB();
    const reg = await Registration.findOne({ uniqueId });
    if (!reg) throw new Error('User not found');

    reg.accommodationType = accommodationData.type;
    reg.price = String(accommodationData.price);
    reg.duration = accommodationData.duration || '';

    await reg.save();

    try {
        await sheetsUpdateAccommodation(uniqueId, accommodationData);
    } catch (err: any) {
        console.warn('Google Sheets sync failed for updateAccommodation:', err);
        if (err.message === 'User not found via Unique ID' || err?.message?.includes('User not found via Unique ID')) {
            try {
                await sheetsAppendRegistration(reg, uniqueId);
                await sheetsUpdateAccommodation(uniqueId, accommodationData);
            } catch (appendErr) {
                console.warn('Also failed to append missing user to Google Sheets:', appendErr);
            }
        }
    }

    return true;
}

export async function updatePaymentProof(uniqueId: string, fileLink: string, type: 'registration' | 'accommodation' = 'accommodation') {
    await connectDB();
    const reg = await Registration.findOne({ uniqueId });
    if (!reg) throw new Error('User not found');

    if (type === 'registration') {
        reg.registrationPaymentProof = fileLink;
    } else {
        reg.paymentProof = fileLink;
    }

    await reg.save();

    try {
        await sheetsUpdatePaymentProof(uniqueId, fileLink, type);
    } catch (err: any) {
        console.warn('Google Sheets sync failed for updatePaymentProof:', err);
        if (err.message === 'User not found via Unique ID' || err?.message?.includes('User not found via Unique ID')) {
            try {
                await sheetsAppendRegistration(reg, uniqueId);
                await sheetsUpdatePaymentProof(uniqueId, fileLink, type);
            } catch (appendErr) {
                console.warn('Also failed to append missing user to Google Sheets:', appendErr);
            }
        }
    }

    return true;
}

export async function updateUserDepartment(uniqueId: string, deptData: any) {
    await connectDB();
    const reg = await Registration.findOne({ uniqueId });
    if (!reg) throw new Error('User not found');

    reg.departmentStatus = deptData.status;
    reg.department = deptData.department || '';
    reg.subDepartment = deptData.subDepartment || '';

    await reg.save();

    try {
        await sheetsUpdateUserDepartment(uniqueId, deptData);
    } catch (err: any) {
        console.warn('Google Sheets sync failed for updateUserDepartment:', err);
        if (err.message === 'User not found via Unique ID' || err?.message?.includes('User not found via Unique ID')) {
            try {
                await sheetsAppendRegistration(reg, uniqueId);
                await sheetsUpdateUserDepartment(uniqueId, deptData);
            } catch (appendErr) {
                console.warn('Also failed to append missing user to Google Sheets:', appendErr);
            }
        }
    }

    return true;
}

export async function updateRegistrationStatus(uniqueId: string, status: string) {
    await connectDB();
    const reg = await Registration.findOne({ uniqueId });
    if (!reg) throw new Error('User not found');

    reg.registrationStatus = status;

    await reg.save();

    try {
        await sheetsUpdateRegistrationStatus(uniqueId, status);
    } catch (err: any) {
        console.warn('Google Sheets sync failed for updateRegistrationStatus:', err);
        if (err.message === 'User not found via Unique ID' || err?.message?.includes('User not found via Unique ID')) {
            try {
                await sheetsAppendRegistration(reg, uniqueId);
                await sheetsUpdateRegistrationStatus(uniqueId, status);
            } catch (appendErr) {
                console.warn('Also failed to append missing user to Google Sheets:', appendErr);
            }
        }
    }

    return true;
}

export async function findUserByIdOrEmail(query: string) {
    await connectDB();
    
    const user = await Registration.findOne({
        $or: [
            { uniqueId: query },
            { email: new RegExp('^' + query + '$', 'i') }
        ]
    }).lean();

    if (!user) return null;
    return formatRegistration(user);
}

export async function findByPaymentReference(reference: string) {
    await connectDB();
    const user = await Registration.findOne({ paymentReference: reference }).lean();
    if (!user) return null;
    return formatRegistration(user);
}

export async function findAllByPaymentReference(reference: string) {
    await connectDB();
    const users = await Registration.find({ paymentReference: reference }).lean();
    return users.map((u: any) => formatRegistration(u));
}

export async function updatePaymentReference(uniqueId: string, reference: string) {
    await connectDB();
    const reg = await Registration.findOne({ uniqueId });
    if (!reg) throw new Error('User not found');
    reg.paymentReference = reference;
    await reg.save();
    return true;
}
