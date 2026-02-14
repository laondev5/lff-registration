import mongoose from 'mongoose';
import { connectDB } from './mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';
import {
    addProduct as sheetsAddProduct,
    updateProduct as sheetsUpdateProduct,
    deleteProduct as sheetsDeleteProduct,
    createOrder as sheetsCreateOrder,
    updateOrderStatus as sheetsUpdateOrderStatus,
} from './googleSheets';

function isObjectId(id: string) {
    return mongoose.Types.ObjectId.isValid(id) && /^[a-f\d]{24}$/i.test(id);
}

async function findProductById(id: string) {
    if (isObjectId(id)) {
        return Product.findById(id);
    }
    return Product.findOne({ sheetId: id });
}

// ---- Products ----

function formatProduct(p: any) {
    return {
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        price: String(p.price ?? ''),
        category: p.category,
        images: p.images || [],
        stock: String(p.stock ?? 0),
        variants: p.variants || [],
        colors: p.colors || [],
        sizes: p.sizes || [],
        sheetId: p.sheetId || '',
        createdAt: p.createdAt?.toISOString?.() || p.createdAt,
    };
}

export async function getProducts() {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return products.map((p: any) => formatProduct(p));
}

export async function getProduct(id: string) {
    await connectDB();
    const p = await findProductById(id).then(d => d?.toObject()) as any;
    if (!p) return null;
    return formatProduct(p);
}

export async function createProduct(data: any) {
    await connectDB();
    const product = await Product.create({
        name: data.name,
        description: data.description || '',
        price: Number(data.price),
        category: data.category || '',
        images: data.images || [],
        stock: data.stock !== undefined && data.stock !== '' ? Number(data.stock) : 0,
        variants: data.variants || [],
        colors: data.colors || [],
        sizes: data.sizes || [],
    });

    const id = product._id.toString();

    // Sync to Google Sheets (non-blocking, best-effort)
    try {
        const sheetId = await sheetsAddProduct({
            ...data,
            price: data.price,
            stock: data.stock || '0',
        });
        product.sheetId = sheetId;
        await product.save();
    } catch (err) {
        console.warn('Google Sheets sync failed for createProduct:', err);
    }

    return id;
}

export async function updateProduct(id: string, data: any) {
    await connectDB();
    const product = await findProductById(id);
    if (!product) throw new Error('Product not found');

    if (data.name !== undefined) product.name = data.name;
    if (data.description !== undefined) product.description = data.description;
    if (data.price !== undefined) product.price = Number(data.price);
    if (data.category !== undefined) product.category = data.category;
    if (data.images !== undefined) product.images = data.images;
    if (data.stock !== undefined && data.stock !== '') product.stock = Number(data.stock);
    if (data.variants !== undefined) product.variants = data.variants;
    if (data.colors !== undefined) product.colors = data.colors;
    if (data.sizes !== undefined) product.sizes = data.sizes;

    await product.save();

    // Sync to Google Sheets
    try {
        if (product.sheetId) {
            await sheetsUpdateProduct(product.sheetId, data);
        }
    } catch (err) {
        console.warn('Google Sheets sync failed for updateProduct:', err);
    }

    return true;
}

export async function deleteProduct(id: string) {
    await connectDB();
    const product = await findProductById(id);
    if (!product) throw new Error('Product not found');

    const sheetId = product.sheetId;
    await Product.findByIdAndDelete(product._id);

    // Sync to Google Sheets
    try {
        if (sheetId) {
            await sheetsDeleteProduct(sheetId);
        }
    } catch (err) {
        console.warn('Google Sheets sync failed for deleteProduct:', err);
    }

    return true;
}

// ---- Orders ----

export async function getOrders() {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return orders.map((o: any) => ({
        id: o.orderId,
        oderId: o.orderId,
        userId: o.userId,
        items: o.items,
        total: o.total,
        status: o.status,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        paymentProof: o.paymentProof || '',
        createdAt: o.createdAt?.toISOString?.() || o.createdAt,
    }));
}

export async function createOrder(data: any) {
    await connectDB();

    const orderId = `ORD-${Date.now()}`;

    const compactItems = (data.items || []).map((item: any) => ({
        productId: item.product?.id || item.productId || '',
        name: item.product?.name || item.name || '',
        price: Number(item.product?.price || item.price || 0),
        quantity: item.quantity || 1,
        selectedColor: item.selectedColor || '',
        selectedSize: item.selectedSize || '',
    }));

    await Order.create({
        orderId,
        userId: data.userId || 'GUEST',
        items: compactItems,
        total: Number(data.total),
        status: 'Pending',
        customerName: data.customerName || '',
        customerEmail: data.customerEmail || '',
        customerPhone: data.customerPhone || '',
        paymentProof: data.paymentProof || '',
    });

    // Sync to Google Sheets
    try {
        await sheetsCreateOrder(data);
    } catch (err) {
        console.warn('Google Sheets sync failed for createOrder:', err);
    }

    return orderId;
}

export async function updateOrderStatus(orderId: string, status: string) {
    await connectDB();
    const order = await Order.findOne({ orderId });
    if (!order) throw new Error('Order not found');

    order.status = status;
    await order.save();

    // Sync to Google Sheets
    try {
        await sheetsUpdateOrderStatus(orderId, status);
    } catch (err) {
        console.warn('Google Sheets sync failed for updateOrderStatus:', err);
    }

    return true;
}
