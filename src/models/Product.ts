import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
    color: string;
    size: string;
    stock: number;
    sku?: string;
}

export interface IProductColor {
    name: string;
    hex: string;
}

export interface IProduct extends Document {
    name: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    stock: number;
    variants: IProductVariant[];
    colors: IProductColor[];
    sizes: string[];
    sheetId: string;
    createdAt: Date;
}

const ProductVariantSchema = new Schema({
    color: { type: String, default: '' },
    size: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    sku: { type: String, default: '' },
}, { _id: false });

const ProductColorSchema = new Schema({
    name: { type: String, default: '' },
    hex: { type: String, default: '' },
}, { _id: false });

const ProductSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    category: { type: String, default: '' },
    images: { type: [String], default: [] },
    stock: { type: Number, default: 0 },
    variants: { type: [ProductVariantSchema], default: [] },
    colors: { type: [ProductColorSchema], default: [] },
    sizes: { type: [String], default: [] },
    sheetId: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
