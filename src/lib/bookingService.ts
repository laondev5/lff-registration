import { connectDB } from './mongodb';
import Booking from '@/models/Booking';
import Registration from '@/models/Registration';

export async function getAllBookings() {
    await connectDB();
    
    // Fetch independent bookings
    const bookings = await Booking.find().lean();
    
    // Fetch accommodations booked during registration
    const registrations = await Registration.find({ 
        needsAccommodation: 'Yes',
        accommodationType: { $exists: true, $ne: '' }
    }).lean();
    
    // Format independent bookings
    const formattedBookings = bookings.map((b: any) => ({
         id: b._id.toString(),
         name: b.name,
         email: b.email,
         phone: b.phone,
         accommodationType: b.accommodationType,
         accommodationId: b.accommodationId || '',
         amount: b.amount,
         paymentProof: b.paymentProof,
         uniqueId: b.uniqueId || '',
         status: b.status || 'Pending',
         createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
         isRegistration: false
    }));

    // Format registration bookings
    const formattedRegistrations = registrations.map((r: any) => ({
        id: r._id.toString(),
        name: r.fullName,
        email: r.email,
        phone: r.phoneNumber,
        accommodationType: r.accommodationType,
        accommodationId: '', // Usually not explicitly linked via ID when coming from registration form
        amount: r.price || '0', 
        paymentProof: r.paymentProof || '', // Or registrationPaymentProof if they uploaded that? 
        uniqueId: r.uniqueId || '',
        status: r.registrationStatus === 'Paid' ? 'Confirmed' : 'Pending',
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
        isRegistration: true
    }));

    // Combine and sort
    return [...formattedBookings, ...formattedRegistrations].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending
    });
}
