import Link from "next/link";
import { CheckCircle, MapPin, ShoppingBag } from "lucide-react";

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800">Order Confirmed!</h1>

        <p className="text-gray-600 text-lg">
          Thank you for your purchase. Your payment has been received
          successfully.
        </p>

        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center justify-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Pickup Instructions
          </h3>
          <p className="text-gray-600">Please pick up your items at:</p>
          <p className="text-xl font-bold text-primary">
            Alheri Prayer Village
          </p>
          <p className="text-sm text-gray-500">
            Show your email confirmation or order number upon arrival.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/store"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity w-full sm:w-auto"
          >
            <ShoppingBag className="w-5 h-5" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
