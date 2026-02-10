"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { accommodations } from '@/lib/data';
import { useRegistrationStore } from '@/store/useRegistrationStore';
import { ChevronLeft, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccommodationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use() or await if async component, but here it's client component so params is a Promise in Next 15+?
  // Actually in Next 15 params is a Promise. In Next 14 it was an object.
  // The user prompt said Next.js project with "latest version". Next 15 is latest.
  // So I should treat params as a Promise.
  
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const accommodation = accommodations.find(a => a.id === id);
  
  const router = useRouter();
  const { data: userData, updateData } = useRegistrationStore();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Determine if user has a unique ID (means they registered)
  // But wait, the unique ID is returned by the API response, NOT stored in the form data by default unless I stored it.
  // I need to update `useRegistrationStore` to store `uniqueId`.
  // I'll assume I'll update the store to include `uniqueId` field.
  // For now I'll cast userData as any to access uniqueId or just check if they have a name.
  // If no uniqueId, we can't update the sheet. 
  // Maybe I should add `uniqueId` to the store interface.
  
  const uniqueId = (userData as any).uniqueId; 

  const handleBook = async () => {
    if (!accommodation) return;
    
    setLoading(true);
    setError('');

    try {
      const payload = {
        uniqueId,
        accommodation: {
          type: accommodation.type,
          price: accommodation.name + " - " + accommodation.price, // Combining for sheet clarity
          duration: "Full Event" // specific duration not captured in UI yet
        }
      };

      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Booking failed");
      }

      setSuccess(true);
      // Update local store
      updateData({ 
        accommodationId: accommodation.id, 
        accommodationType: accommodation.type 
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!accommodation) {
    return (
        <div className="min-h-screen flex items-center justify-center text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Accommodation Not Found</h1>
                <Link href="/accommodations" className="text-primary hover:underline">Return to list</Link>
            </div>
        </div>
    );
  }

  // If user hasn't registered (no uniqueId), prompt them.
  // Note: in a real app, we'd persist store to localStorage to survive refresh.
  // If store is empty, user is lost.
  if (!uniqueId) {
      return (
          <div className="min-h-screen flex items-center justify-center text-white bg-background p-4">
            <div className="max-w-md text-center p-8 bg-card border border-white/10 rounded-xl">
                <h1 className="text-2xl font-bold mb-4">Registration Required</h1>
                <p className="text-gray-400 mb-6">You must register for the conference before booking an accommodation.</p>
                <Link href="/" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:opacity-90">
                    Go to Registration
                </Link>
            </div>
          </div>
      );
  }

  return (
    <main className="min-h-screen bg-background text-foreground py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link href="/accommodations" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Accommodations
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Image Section */}
            <div className={cn("rounded-2xl h-[400px] w-full bg-cover bg-center shadow-2xl", accommodation.image)}></div>
            
            {/* Details Section */}
            <div className="flex flex-col justify-center">
                <div className="mb-2">
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                        {accommodation.type}
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{accommodation.name}</h1>
                <p className="text-2xl text-primary font-bold mb-6">₦{accommodation.price.toLocaleString()}</p>
                
                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                    {accommodation.description}
                </p>

                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
                    <ul className="grid grid-cols-2 gap-3">
                        {accommodation.features?.map((feature, i) => (
                            <li key={i} className="flex items-center text-gray-400">
                                <Check className="w-4 h-4 mr-2 text-green-500" /> {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-auto">
                    {success ? (
                        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-center">
                            <h3 className="font-bold text-lg mb-2">Booking Confirmed!</h3>
                            <p>Thank you, {userData.fullName}. Your accommodation has been reserved.</p>
                            <Link href="/" className="inline-block mt-4 text-sm underline hover:text-white">Return to Home</Link>
                        </div>
                    ) : (
                        <button 
                            onClick={handleBook}
                            disabled={loading}
                            className="w-full py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Book This Room"}
                        </button>
                    )}
                    {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}
