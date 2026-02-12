"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Upload, X, Plus } from 'lucide-react';
// Actually, `uploadToCloudinary` in `src/lib/cloudinary.ts` uses `cloudinary` npm package which is Node.js only.
// We need a server action or an API route to handle the upload if we use that function.
// Or we can use signed uploads from the client.
// Given the previous files, let's see how `uploadToCloudinary` is implemented.
// It imports `v2 as cloudinary`. This is server-side only.
// So we need an API route for uploading files.

// API route for upload: /api/upload (we assume one exists or we make one)
// The user already has `/api/upload-payment`. I can reuse the logic or make a general `/api/upload`.
// Let's create `src/app/api/upload/route.ts` first or just use a server action in this file if Next.js 14+ (it is 15/16).
// But `uploadToCloudinary` takes a `File` object.
// I'll create a server action in `src/actions/upload.ts` or just use an API route.
// Let's stick to API route for consistency with existing code.

const productSchema = z.object({
    name: z.string().min(2, "Name is required"),
    description: z.string().min(10, "Description is required"),
    price: z.string().min(1, "Price is required"), // Keep as string for simple input, convert later
    category: z.string().min(1, "Category is required"),
    stock: z.string(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [images, setImages] = useState<string[]>(initialData?.images || []);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            price: initialData?.price || '',
            category: initialData?.category || '',
            stock: initialData?.stock || '0',
        },
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setUploading(true);
        const files = Array.from(e.target.files);

        try {
            // We need an endpoint that accepts a file and returns a URL.
            // I'll assume /api/upload handles this.
            // I'll create this API route in a moment.
            
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                
                const data = await res.json();
                if (data.success) {
                    setImages(prev => [...prev, data.url]);
                } else {
                    alert('Upload failed: ' + data.error);
                }
            }
        } catch (error) {
            console.error(error);
            alert('Error custom uploading images');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: ProductFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                images,
            };

            const url = isEdit ? `/api/store/products/${initialData.id}` : '/api/store/products';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (!result.success) throw new Error(result.error);

            router.push('/admin/store/products');
            router.refresh();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Product Name</label>
                    <input
                        {...register('name')}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Price (₦)</label>
                    <input
                        type="number" // Just for UI constraint, handled as string
                        {...register('price')}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    />
                    {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Category</label>
                     <select
                        {...register('category')}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    >
                        <option value="">Select Category</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Souvenirs">Souvenirs</option>
                        <option value="Books">Books</option>
                    </select>
                    {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Stock Quantity</label>
                    <input
                        type="number"
                        {...register('stock')}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    />
                    {errors.stock && <p className="text-red-500 text-xs">{errors.stock.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
                {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
            </div>

            <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700">Product Images</label>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square bg-gray-100 rounded-md overflow-hidden">
                            <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    
                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 cursor-pointer transition-colors">
                        {uploading ? (
                            <Loader2 className="animate-spin text-gray-400" />
                        ) : (
                            <>
                                <Upload className="text-gray-400 mb-2" />
                                <span className="text-xs text-gray-500">Upload</span>
                            </>
                        )}
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting || uploading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin w-4 h-4 mr-2" /> Saving...
                        </>
                    ) : (
                        'Save Product'
                    )}
                </button>
            </div>
        </form>
    );
}
