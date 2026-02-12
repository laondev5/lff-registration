"use client";

import { AccommodationCard } from "@/components/AccommodationCard";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Accommodation {
    id: string;
    title: string;
    description: string;
    price: string;
    imageUrl: string;
    slots: string;
    createdAt: string;
    fileId: string;
    // Helper to map to Card props if needed
}

export default function AccommodationsPage() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      async function fetchAcc() {
          try {
              const res = await fetch('/api/accommodations');
              const data = await res.json();
              if (data.success) {
                  setAccommodations(data.accommodations);
              }
          } catch (e) {
              console.error(e);
          } finally {
              setLoading(false);
          }
      }
      fetchAcc();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
                 <h1 className="text-4xl font-bold text-white mb-2">Available Accommodations</h1>
                 <p className="text-gray-400">Choose your stay for LFF GAC 2026</p>
            </div>
            <Link href="/" className="mt-4 md:mt-0 text-primary hover:underline">
                &larr; Back to Home
            </Link>
        </div>
        
        {loading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        ) : accommodations.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
                <p>No accommodations available at the moment.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {accommodations.map(acc => (
                    // Mapping backend fields to Card props.
                    // Card expects: id, name, type, price, description, features, image
                    // Backend gives: id, title, description, price, imageUrl, slots
                    <AccommodationCard 
                        key={acc.id} 
                        id={acc.id}
                        name={acc.title}
                        type="Standard" // Default or derive from somewhere
                        price={parseInt(acc.price.replace(/[^0-9]/g, '')) || 0}
                        description={acc.description}
                        features={[]} // Features not in sheet currently
                        image={acc.imageUrl || "bg-gray-800"} // Use imageUrl or fallback
                        imageUrl={acc.imageUrl} // Pass real URL if card supports it
                    />
                ))}
            </div>
        )}
      </div>
    </main>
  );
}
