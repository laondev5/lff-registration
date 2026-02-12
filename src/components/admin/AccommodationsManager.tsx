'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import Image from 'next/image';

interface Accommodation {
    id: string;
    title: string;
    description: string;
    price: string;
    slots: string;
    imageUrl: string;
    fileId?: string;
}

export default function AccommodationsManager({ initialData }: { initialData: Accommodation[] }) {
    const [accommodations, setAccommodations] = useState<Accommodation[]>(initialData);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form State
    const [currentId, setCurrentId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [slots, setSlots] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState('');

    const router = useRouter();

    const openModal = (acc?: Accommodation) => {
        if (acc) {
            setIsEditing(true);
            setCurrentId(acc.id);
            setTitle(acc.title);
            setDescription(acc.description);
            setPrice(acc.price);
            setSlots(acc.slots);
        } else {
            setIsEditing(false);
            setCurrentId('');
            setTitle('');
            setDescription('');
            setPrice('');
            setSlots('');
            setImageUrl('');
        }
        setFile(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('slots', slots);
        
        if (file) {
            formData.append('file', file);
        }
        if (imageUrl) {
            formData.append('imageUrl', imageUrl);
        }

        if (isEditing) {
            formData.append('id', currentId);
        }

        try {
            const method = isEditing ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/accommodations', {
                method,
                body: formData,
            });

            if (res.ok) {
                // Refresh data
                router.refresh();
                // Optimistic update or just fetch again? 
                // Since router.refresh() refreshes the server component, but we are in a client component 
                // receiving initialData, we might not see updates immediately unless we fetch or reload.
                // Better to simple reload window or fetch updated list.
                // For a smooth experience, let's fetch list again or just reload page.
                window.location.reload(); 
            } else {
                alert('Failed to save accommodation');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsLoading(false);
            closeModal();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this accommodation?')) return;

        try {
            const res = await fetch(`/api/admin/accommodations?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setAccommodations(prev => prev.filter(a => a.id !== id));
                router.refresh();
            } else {
                alert('Failed to delete');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Accommodations</h1>
                <button 
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    <Plus size={18} className="mr-2" />
                    Add New
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accommodations.map((acc) => (
                    <div key={acc.id} className="bg-white rounded-lg shadow-md overflow-hidden border">
                        <div className="relative h-48 w-full bg-gray-200">
                             {/* Use simple img tag if optimization is tricky with external google drive links */}
                            <img 
                                src={acc.imageUrl || '/placeholder.jpg'} 
                                alt={acc.title} 
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-gray-900">{acc.title}</h3>
                            <p className="text-blue-600 font-semibold mt-1">{acc.price}</p>
                            <p className="text-gray-500 text-sm mt-2 line-clamp-3">{acc.description}</p>
                            <div className="text-sm text-gray-500 mt-2">Slots: {acc.slots}</div>
                            
                            <div className="flex justify-end mt-4 space-x-2">
                                <button 
                                    onClick={() => openModal(acc)}
                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full"
                                >
                                    <Edit size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(acc.id)}
                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {isEditing ? 'Edit Accommodation' : 'Add Accommodation'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                    <input
                                        type="text"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                                        placeholder="e.g. $50/night"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Slots</label>
                                    <input
                                        type="number"
                                        value={slots}
                                        onChange={e => setSlots(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL <span className="text-gray-400 font-normal">(paste a link)</span></label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload Image <span className="text-gray-400 font-normal">(optional)</span></label>
                                <input
                                    type="file"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-500"
                                    accept="image/*"
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Saving...' : 'Save Accommodation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
