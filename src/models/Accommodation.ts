import mongoose, { Schema, Document } from 'mongoose';

export interface IAccommodation extends Document {
    accommodationId: string;
    title: string;
    description: string;
    price: string;
    imageUrl: string;
    slots: string;
    createdAt: Date;
    fileId: string;
    sheetId?: string; // Optional: ID returned by Google Sheets
}

const AccommodationSchema = new Schema({
    accommodationId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    slots: { type: String, default: '0' },
    createdAt: { type: Date, default: Date.now },
    fileId: { type: String, default: '' },
    sheetId: { type: String, default: '' },
});

export default mongoose.models.Accommodation || mongoose.model<IAccommodation>('Accommodation', AccommodationSchema);
