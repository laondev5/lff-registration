"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegistrationStore } from '@/store/useRegistrationStore';
import { useCartStore } from '@/store/useCartStore';
import { Loader2, CheckCircle, User, Mail, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const guestSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Valid phone number is required"),
});

type GuestFormData = z.infer<typeof guestSchema>;

export default function CheckoutPage() {
    const router = useRouter();
    const { data } = useRegistrationStore();
    const { items, getTotal, clearCart } = useCartStore();
    
    const [mounted, setMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState('');

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<GuestFormData>({
        resolver: zodResolver(guestSchema)
    });

    useEffect(() => {
        setMounted(true);
        // Pre-fill if registered
        if (data.uniqueId) {
            setValue('fullName', data.fullName || '');
            setValue('email', data.email || '');
            setValue('phone', data.phoneNumber || '');
        }
    }, [data, setValue]);

    if (!mounted) return null;

    if (items.length === 0 && !orderSuccess) {
        router.push('/store');
        return null;
    }

    const onSubmit = async (formData: GuestFormData) => {
        setIsSubmitting(true);
        try {
            const orderData = {
                userId: data.uniqueId || null,
                items,
                total: getTotal().toString(),
                customerName: formData.fullName,
                customerEmail: formData.email,
                customerPhone: formData.phone
            };

            const res = await fetch('/api/store/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const result = await res.json();
            if (result.success) {
                setOrderId(result.id);
                setOrderSuccess(true);
                clearCart();
            } else {
                alert("Order failed: " + result.error);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred placing your order.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-card border border-white/10 rounded-2xl p-8 text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Order Placed!</h2>
                    <p className="text-gray-400 mb-2">
                        Your order <strong>#{orderId}</strong> has been successfully placed.
                    </p>
                    <p className="text-sm text-gray-500 mb-8">
                        We will contact you via email/phone regarding payment and delivery.
                    </p>
                    <Link href="/store" className="btn-primary inline-flex items-center">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="container mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Order Summary */}
                <div className="bg-card border border-white/10 rounded-2xl p-6 h-fit">
                    <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {items.map((item) => (
                            <div key={item.product.id} className="flex gap-4 items-center bg-white/5 p-3 rounded-lg">
                                <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                    {item.product.images[0] && (
                                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{item.product.name}</p>
                                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-bold text-primary">
                                    ₦{(parseInt(item.product.price) * item.quantity).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-white/10 pt-4 flex justify-between text-white font-bold text-xl">
                        <span>Total</span>
                        <span>₦{getTotal().toLocaleString()}</span>
                    </div>
                </div>

                {/* Customer Details Form */}
                <div className="bg-card border border-white/10 rounded-2xl p-8 h-fit">
                    <h1 className="text-2xl font-bold text-white mb-6">Customer Details</h1>
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                <input
                                    {...register('fullName')}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                            {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                <input
                                    {...register('email')}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="john@example.com"
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-300">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                <input
                                    {...register('phone')}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="08012345678"
                                />
                            </div>
                            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full btn-primary py-3 text-lg font-bold flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                                    </>
                                ) : (
                                    "Confirm Order"
                                )}
                            </button>
                            <p className="text-xs text-center text-gray-500 mt-4">
                                By placing this order, you agree to our terms of service.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
