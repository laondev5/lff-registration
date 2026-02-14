"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Upload, X, Plus, Palette, Ruler } from 'lucide-react';

const productSchema = z.object({
    name: z.string().min(2, "Name is required"),
    description: z.string().min(10, "Description is required"),
    price: z.string().min(1, "Price is required"),
    category: z.string().min(1, "Category is required"),
    stock: z.string(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ColorOption {
    name: string;
    hex: string;
}

interface VariantStock {
    color: string;
    size: string;
    stock: number;
    sku: string;
}

interface ProductFormProps {
    initialData?: any;
    isEdit?: boolean;
}

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [images, setImages] = useState<string[]>(initialData?.images || []);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Variant state
    const [sizes, setSizes] = useState<string[]>(initialData?.sizes || []);
    const [colors, setColors] = useState<ColorOption[]>(initialData?.colors || []);
    const [variants, setVariants] = useState<VariantStock[]>(initialData?.variants || []);
    const [customSize, setCustomSize] = useState('');
    const [newColorName, setNewColorName] = useState('');
    const [newColorHex, setNewColorHex] = useState('#000000');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialData?.name ?? '',
            description: initialData?.description ?? '',
            price: initialData?.price != null ? String(initialData.price) : '',
            category: initialData?.category ?? '',
            stock: initialData?.stock != null ? String(initialData.stock) : '0',
        },
    });

    const toggleSize = (size: string) => {
        setSizes(prev => {
            const next = prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size];
            updateVariantsGrid(next, colors);
            return next;
        });
    };

    const addCustomSize = () => {
        const s = customSize.trim().toUpperCase();
        if (s && !sizes.includes(s)) {
            const next = [...sizes, s];
            setSizes(next);
            updateVariantsGrid(next, colors);
        }
        setCustomSize('');
    };

    const addColor = () => {
        const name = newColorName.trim();
        if (!name) return;
        if (colors.some(c => c.name.toLowerCase() === name.toLowerCase())) return;
        const next = [...colors, { name, hex: newColorHex }];
        setColors(next);
        updateVariantsGrid(sizes, next);
        setNewColorName('');
        setNewColorHex('#000000');
    };

    const removeColor = (index: number) => {
        const removed = colors[index];
        const next = colors.filter((_, i) => i !== index);
        setColors(next);
        setVariants(prev => prev.filter(v => v.color !== removed.name));
    };

    const updateVariantsGrid = (currentSizes: string[], currentColors: ColorOption[]) => {
        if (currentSizes.length === 0 || currentColors.length === 0) {
            setVariants([]);
            return;
        }
        setVariants(prev => {
            const newVariants: VariantStock[] = [];
            for (const color of currentColors) {
                for (const size of currentSizes) {
                    const existing = prev.find(v => v.color === color.name && v.size === size);
                    newVariants.push(existing || {
                        color: color.name,
                        size,
                        stock: 0,
                        sku: `${color.name.substring(0, 3).toUpperCase()}-${size}`,
                    });
                }
            }
            return newVariants;
        });
    };

    const updateVariantStock = (color: string, size: string, stock: number) => {
        setVariants(prev => prev.map(v =>
            v.color === color && v.size === size ? { ...v, stock } : v
        ));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const files = Array.from(e.target.files);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success) {
                    setImages(prev => [...prev, data.url]);
                } else {
                    alert('Upload failed: ' + data.error);
                }
            }
        } catch (error) {
            console.error(error);
            alert('Error uploading images');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const getTotalVariantStock = () => variants.reduce((sum, v) => sum + v.stock, 0);

    const onSubmit = async (data: ProductFormData) => {
        setIsSubmitting(true);
        try {
            const totalStock = variants.length > 0 ? getTotalVariantStock().toString() : data.stock;
            const payload = {
                ...data,
                stock: totalStock,
                images,
                variants,
                colors,
                sizes,
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Product Name</label>
                            <input
                                {...register('name')}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black transition-shadow"
                            />
                            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Price (₦)</label>
                            <input
                                type="number"
                                {...register('price')}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black transition-shadow"
                            />
                            {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Category</label>
                            <select
                                {...register('category')}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black transition-shadow"
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
                            <label className="text-sm font-medium text-gray-700">
                                Base Stock {variants.length > 0 && <span className="text-xs text-gray-400">(auto-calculated from variants: {getTotalVariantStock()})</span>}
                            </label>
                            <input
                                type="number"
                                {...register('stock')}
                                disabled={variants.length > 0}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black transition-shadow disabled:bg-gray-100 disabled:text-gray-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 mt-6">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            {...register('description')}
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black transition-shadow"
                        />
                        {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
                    </div>
                </div>
            </div>

            {/* Images Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Product Images</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}

                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors bg-gray-50 hover:bg-blue-50">
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
            </div>

            {/* Variants Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Ruler className="w-5 h-5" /> Sizes & <Palette className="w-5 h-5" /> Colors
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Add sizes and colors to create variant combinations</p>
                </div>
                <div className="p-6 space-y-8">
                    {/* Sizes */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-3">Available Sizes</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {PRESET_SIZES.map(size => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => toggleSize(size)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                        sizes.includes(size)
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customSize}
                                onChange={e => setCustomSize(e.target.value)}
                                placeholder="Custom size..."
                                className="p-2 border border-gray-300 rounded-lg text-sm text-black flex-1 max-w-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
                            />
                            <button type="button" onClick={addCustomSize} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                                <Plus size={16} />
                            </button>
                        </div>
                        {sizes.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                                Selected: {sizes.join(', ')}
                            </div>
                        )}
                    </div>

                    {/* Colors */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-3">Available Colors</label>
                        {colors.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-4">
                                {colors.map((color, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                        <div
                                            className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-inner"
                                            style={{ backgroundColor: color.hex }}
                                        />
                                        <span className="text-sm text-gray-700 font-medium">{color.name}</span>
                                        <button type="button" onClick={() => removeColor(idx)} className="text-gray-400 hover:text-red-500 ml-1">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={newColorHex}
                                onChange={e => setNewColorHex(e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300"
                            />
                            <input
                                type="text"
                                value={newColorName}
                                onChange={e => setNewColorName(e.target.value)}
                                placeholder="Color name (e.g. Red)"
                                className="p-2 border border-gray-300 rounded-lg text-sm text-black flex-1 max-w-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor())}
                            />
                            <button type="button" onClick={addColor} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                                Add Color
                            </button>
                        </div>
                    </div>

                    {/* Variant Stock Grid */}
                    {variants.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-3">
                                Variant Stock ({variants.length} combinations, Total: {getTotalVariantStock()})
                            </label>
                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {variants.map((v, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-4 h-4 rounded-full border border-gray-300"
                                                            style={{ backgroundColor: colors.find(c => c.name === v.color)?.hex }}
                                                        />
                                                        {v.color}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-700 font-medium">{v.size}</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">{v.sku}</td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={v.stock}
                                                        onChange={e => updateVariantStock(v.color, v.size, parseInt(e.target.value) || 0)}
                                                        className="w-20 p-1.5 border border-gray-300 rounded text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting || uploading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium shadow-sm transition-colors"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin w-4 h-4 mr-2" /> Saving...
                        </>
                    ) : (
                        isEdit ? 'Update Product' : 'Create Product'
                    )}
                </button>
            </div>
        </form>
    );
}
