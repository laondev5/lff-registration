import mongoose from 'mongoose';
import { connectDB } from './mongodb';
import Accommodation, { IAccommodation } from '@/models/Accommodation';
import Registration from '@/models/Registration';
import Booking from '@/models/Booking';
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
        accessTags: Array.isArray(a.accessTags) ? a.accessTags : [],
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
    // We only count it if they need accommodation and have actually chosen a type
    const regUsers = await Registration.find({
        needsAccommodation: 'Yes',
        accommodationType: { $exists: true, $ne: '' }
    }).lean();

    // Also count independent bookings
    const bookings = await Booking.find({
        accommodationType: { $exists: true, $ne: '' }
    }).lean();

    return accommodations.map(acc => {
        const titleMatch = acc.title.trim().toLowerCase();
        
        // Count from registrations
        const regBookedSlots = regUsers.filter((user: any) => 
            (user.accommodationType || '').trim().toLowerCase() === titleMatch
        ).length;

        // Count from independent bookings
        const indBookedSlots = bookings.filter((b: any) => 
            (b.accommodationType || '').trim().toLowerCase() === titleMatch ||
            b.accommodationId === acc.id
        ).length;

        const bookedSlots = regBookedSlots + indBookedSlots;
        const totalSlots = parseInt(acc.slots || '0', 10);
        
        let remainingSlots = totalSlots - bookedSlots;
        if (remainingSlots < 0) remainingSlots = 0; // Prevent negative remaining slots visually
        
        return {
            ...acc,
            bookedSlots,
            remainingSlots,
            isFullyBooked: totalSlots <= 0 || bookedSlots >= totalSlots
        };
    });
}

export async function getAccommodationsForUser(userTags: string[]) {
    const allAccommodations = await getAccommodationsWithAvailability();
    
    // Clean and lower case user tags
    const cleanUserTags = userTags.map(t => t?.trim().toLowerCase()).filter(Boolean);
    
    // Filter accommodations
    return allAccommodations.filter(acc => {
        const accessTags = Array.isArray(acc.accessTags) ? acc.accessTags : [];
        
        // If no access tags are defined, it's general accommodation, everyone sees it
        if (accessTags.length === 0) return true;
        
        // If there are tags, user must have at least one matching tag
        return accessTags.some(tag => {
            const cleanTag = typeof tag === 'string' ? tag.trim().toLowerCase() : '';
            return cleanUserTags.includes(cleanTag);
        });
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
        accessTags: Array.isArray(data.accessTags) ? data.accessTags : [],
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
    if (data.accessTags !== undefined) acc.accessTags = data.accessTags;

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
