"use client";

import Link from "next/link";
import { CheckCircle, MapPin, ShoppingBag } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="bg-card border border-white/10 text-card-foreground p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>

      <h1 className="text-3xl font-bold text-white">Order Confirmed!</h1>

      <p className="text-gray-400 text-lg">
        Thank you for your purchase. Your payment has been received
        successfully.
      </p>

      {orderId && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-sm text-gray-400">Order Reference</p>
          <p className="text-lg font-mono font-bold text-primary">{orderId}</p>
        </div>
      )}

      <div className="bg-primary/10 border border-primary/20 p-6 rounded-xl space-y-3">
        <h3 className="font-bold text-white flex items-center justify-center gap-2">
          <MapPin className="w-5 h-5 text-primary" /> Pickup Instructions
        </h3>
        <p className="text-gray-300">Please pick up your items at:</p>
        <p className="text-xl font-bold text-primary">Alheri Prayer Village</p>
        <p className="text-sm text-gray-500">
          Show this screen or your order ID upon arrival.
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/store"
          className="btn-primary w-full py-4 flex items-center justify-center gap-2 font-bold"
        >
          <ShoppingBag className="w-5 h-5" /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
