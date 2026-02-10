import { AccommodationCard } from "@/components/AccommodationCard";
import Link from "next/link";
import { accommodations } from "@/lib/data";

export default function AccommodationsPage() {
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {accommodations.map(acc => (
                <AccommodationCard key={acc.id} {...acc} />
            ))}
        </div>
      </div>
    </main>
  );
}

