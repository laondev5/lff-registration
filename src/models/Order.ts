import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedColor: string;
    selectedSize: string;
}

export interface IOrder extends Document {
    orderId: string;
    userId: string;
    items: IOrderItem[];
    total: number;
    status: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    createdAt: Date;
}

const OrderItemSchema = new Schema({
    productId: { type: String, default: '' },
    name: { type: String, default: '' },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    selectedColor: { type: String, default: '' },
    selectedSize: { type: String, default: '' },
}, { _id: false });

const OrderSchema = new Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: String, default: 'GUEST' },
    items: { type: [OrderItemSchema], default: [] },
    total: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
