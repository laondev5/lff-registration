"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRegistrationStore } from "@/store/useRegistrationStore";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AccommodationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const router = useRouter();
  const { data: userData, updateData } = useRegistrationStore();

  const [accommodation, setAccommodation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAcc() {
      try {
        const res = await fetch("/api/accommodations");
        const data = await res.json();
        if (data.success) {
          const found = data.accommodations.find((a: any) => a.id === id);
          setAccommodation(found);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAcc();
  }, [id]);

  const uniqueId = userData.uniqueId;

  const handleBook = async () => {
    if (!accommodation) return;

    setBookingLoading(true);
    setError("");

    try {
      const payload = {
        uniqueId,
        accommodation: {
          type: "Standard", // Default for now as not in sheet
          price: accommodation.title + " - " + accommodation.price,
          duration: "Full Event",
        },
      };

      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Booking failed");
      }

      // Update local store
      updateData({
        accommodationId: accommodation.id,
        accommodationType: "Standard",
      });

      // Redirect to payment upload page
      router.push(
        `/upload-payment?id=${uniqueId}&accommodation=${accommodation.title}&amount=${displayPrice}`,
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!accommodation) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accommodation Not Found</h1>
          <Link href="/accommodations" className="text-primary hover:underline">
            Return to list
          </Link>
        </div>
      </div>
    );
  }

  if (!uniqueId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-background p-4">
        <div className="max-w-md text-center p-8 bg-card border border-white/10 rounded-xl">
          <h1 className="text-2xl font-bold mb-4">Registration Required</h1>
          <p className="text-gray-400 mb-6">
            You must register for the conference before booking an
            accommodation.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:opacity-90"
          >
            Go to Registration
          </Link>
        </div>
      </div>
    );
  }

  // Parse price for display
  const displayPrice =
    parseInt(accommodation.price.replace(/[^0-9]/g, "")) || 0;

  return (
    <main className="min-h-screen bg-background text-foreground py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link
          href="/accommodations"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Accommodations
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Section */}
          <div
            className={cn(
              "rounded-2xl h-[400px] w-full bg-cover bg-center shadow-2xl",
              !accommodation.imageUrl && "bg-gray-800",
            )}
            style={
              accommodation.imageUrl
                ? { backgroundImage: `url(${accommodation.imageUrl})` }
                : {}
            }
          ></div>

          {/* Details Section */}
          <div className="flex flex-col justify-center">
            <div className="mb-2">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                Standard
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {accommodation.title}
            </h1>
            <p className="text-2xl text-primary font-bold mb-6">
              ₦{displayPrice.toLocaleString()}
            </p>

            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              {accommodation.description}
            </p>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Features
              </h3>
              <ul className="grid grid-cols-2 gap-3">
                {/* Features not in DB yet, create dummy or skip */}
                <li className="flex items-center text-gray-400">
                  <Check className="w-4 h-4 mr-2 text-green-500" /> Comfortable
                  Bed
                </li>
                <li className="flex items-center text-gray-400">
                  <Check className="w-4 h-4 mr-2 text-green-500" /> Secure
                  Environment
                </li>
              </ul>
            </div>

            <div className="mt-auto">
              <button
                onClick={handleBook}
                disabled={bookingLoading}
                className="w-full py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
              >
                {bookingLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "Book This Room"
                )}
              </button>
              {error && (
                <p className="mt-4 text-red-500 text-center">{error}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
