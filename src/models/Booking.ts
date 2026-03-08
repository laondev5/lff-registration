import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
    name: string;
    email: string;
    phone: string;
    accommodationType: string;
    accommodationId: string;
    amount: string;
    paymentProof: string;
    uniqueId?: string; // Optional link to a registered user
    status: string; // e.g., 'Pending', 'Confirmed'
    createdAt: Date;
}

const BookingSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    accommodationType: { type: String, required: true },
    accommodationId: { type: String, default: '' },
    amount: { type: String, required: true },
    paymentProof: { type: String, default: '' },
    uniqueId: { type: String, default: '' },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
