import mongoose from 'mongoose';
import { connectDB } from './mongodb';
import Accommodation, { IAccommodation } from '@/models/Accommodation';
import Registration from '@/models/Registration';
import {
    getAccommodations as sheetsGetAccommodations,
    getAccommodationsWithAvailability as sheetsGetAccommodationsWithAvailability,
    addAccommodation as sheetsAddAccommodation,
    updateAccommodationListing as sheetsUpdateAccommodationListing,
    deleteAccommodationListing as sheetsDeleteAccommodationListing
} from './googleSheets';

function formatAccommodation(a: IAccommodation | any) {
    return {
        id: a.accommodationId,
        title: a.title,
        description: a.description,
        price: a.price,
        imageUrl: a.imageUrl,
        slots: a.slots,
        days: a.days,
        createdAt: a.createdAt?.toISOString?.() || a.createdAt,
        fileId: a.fileId,
        sheetId: a.sheetId || '',
    };
}

export async function getAccommodations() {
    await connectDB();
    const accommodations = await Accommodation.find().sort({ createdAt: -1 }).lean();
    return accommodations.map((a: any) => formatAccommodation(a));
}

export async function getAccommodationsWithAvailability() {
    await connectDB();
    const accommodations = await getAccommodations();
    
    // Count how many registrations have booked this accommodation
    const users = await Registration.find({
        needsAccommodation: 'Yes',
        registrationStatus: 'Paid'
    }).lean();

    return accommodations.map(acc => {
        // We match by title since that's what usually goes into accommodationType
        const bookedSlots = users.filter((user: any) => user.accommodationType === acc.title).length;
        const totalSlots = parseInt(acc.slots || '0', 10);
        
        return {
            ...acc,
            bookedSlots,
            isFullyBooked: totalSlots > 0 && bookedSlots >= totalSlots
        };
    });
}

export async function addAccommodation(data: any) {
    await connectDB();
    const uniqueId = `ACC-${Date.now()}`;
    
    const acc = await Accommodation.create({
        accommodationId: uniqueId,
        title: data.title,
        description: data.description || '',
        price: data.price,
        imageUrl: data.imageUrl || '',
        slots: data.slots || '0',
        days: data.days || '1',
        fileId: data.fileId || '',
    });

    try {
        const sheetId = await sheetsAddAccommodation(data, uniqueId);
        acc.sheetId = sheetId; 
        await acc.save();
    } catch (err) {
        console.warn('Google Sheets sync failed for addAccommodation:', err);
    }

    return uniqueId;
}

export async function updateAccommodationListing(id: string, data: any) {
    await connectDB();
    const acc = await Accommodation.findOne({ accommodationId: id });
    if (!acc) throw new Error('Accommodation not found');

    if (data.title !== undefined) acc.title = data.title;
    if (data.description !== undefined) acc.description = data.description;
    if (data.price !== undefined) acc.price = data.price;
    if (data.imageUrl !== undefined) acc.imageUrl = data.imageUrl;
    if (data.slots !== undefined) acc.slots = data.slots;
    if (data.days !== undefined) acc.days = data.days;
    if (data.fileId !== undefined) acc.fileId = data.fileId;

    await acc.save();

    try {
        await sheetsUpdateAccommodationListing(id, data);
    } catch (err) {
        console.warn('Google Sheets sync failed for updateAccommodationListing:', err);
    }
    return true;
}

export async function deleteAccommodationListing(id: string) {
    await connectDB();
    const acc = await Accommodation.findOne({ accommodationId: id });
    if (!acc) throw new Error('Accommodation not found');

    await Accommodation.findByIdAndDelete(acc._id);

    try {
        await sheetsDeleteAccommodationListing(id);
    } catch (err) {
        console.warn('Google Sheets sync failed for deleteAccommodationListing:', err);
    }

    return true;
}
