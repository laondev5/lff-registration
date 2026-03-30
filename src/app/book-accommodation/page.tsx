"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  Search,
  User,
  Mail,
  Phone,
  Building2,
  Home,
  ArrowRight,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

interface Accommodation {
  id?: string;
  name: string;
  price: string;
  duration?: string;
  description?: string;
  isFullyBooked?: boolean;
}

interface UserInfo {
  uniqueId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

function BookAccommodationContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const bookingIdParam = searchParams.get("bookingId");

  const [step, setStep] = useState(1); // 1: Lookup, 2: Details, 3: Select Accommodation, 4: Pay
  const [lookupValue, setLookupValue] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [foundUser, setFoundUser] = useState<UserInfo | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] =
    useState<Accommodation | null>(null);

  const [paying, setPaying] = useState(false);

  // Show success state if redirected back from Paystack
  const isSuccess = statusParam === "success";
  const isError = statusParam === "error";

  // Fetch accommodations
  useEffect(() => {
    setLoading(true);
    fetch("/api/accommodations")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAccommodations(data.accommodations || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLookup = async () => {
    if (!lookupValue.trim()) return;
    setLookingUp(true);
    try {
      const res = await fetch("/api/lookup-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idOrEmail: lookupValue.trim() }),
      });
      const data = await res.json();
      if (data.found) {
        setFoundUser(data.user);
        setName(data.user.fullName);
        setEmail(data.user.email);
        setPhone(data.user.phoneNumber);
      } else {
        setFoundUser(null);
      }
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Lookup failed. Please try again.");
    } finally {
      setLookingUp(false);
    }
  };

  const handlePayWithPaystack = async () => {
    if (!selectedAccommodation || !name || !email || !phone) return;
    setPaying(true);

    const priceNum = parseInt(
      (selectedAccommodation.price || "0").toString().replace(/[^0-9]/g, "")
    );

    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: priceNum,
          type: "accommodation",
          metadata: {
            transaction_type: "accommodation",
            name,
            email,
            phone,
            accommodationType: selectedAccommodation.name,
            accommodationId: selectedAccommodation.id || "",
            amount: selectedAccommodation.price,
            uniqueId: foundUser?.uniqueId || "",
          },
        }),
      });

      const result = await res.json();
      if (result.success && result.data?.authorization_url) {
        window.location.href = result.data.authorization_url;
      } else {
        alert("Payment initialization failed: " + (result.error || "Unknown error"));
        setPaying(false);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
      setPaying(false);
    }
  };

  const formatPrice = (price: string | undefined) => {
    if (!price || price === "Free" || price === "0") return "Free";
    const num = parseInt(price.toString().replace(/[^0-9]/g, "") || "0");
    return `₦${num.toLocaleString()}`;
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-white/10 rounded-2xl p-8 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Booking Confirmed!
          </h2>
          {bookingIdParam && (
            <p className="text-gray-400 mb-2">
              Your booking ID is{" "}
              <strong className="text-primary">{bookingIdParam}</strong>.
            </p>
          )}
          <p className="text-sm text-gray-500 mb-8">
            Your payment was successful. You will receive a confirmation email shortly.
          </p>
          <Link href="/" className="btn-primary inline-flex items-center">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
          <p className="text-sm text-gray-500 mb-8">
            Something went wrong with your payment. Please try again.
          </p>
          <Link href="/book-accommodation" className="btn-primary inline-flex items-center">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white">Book Accommodation</h1>
          <p className="text-gray-400 mt-2">
            Find your accommodation for the event
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-10 gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${step >= s ? "bg-primary w-10" : "bg-white/10 w-6"}`}
            />
          ))}
        </div>

        <div className="bg-card border border-white/10 rounded-2xl p-8">
          {/* Step 1: Lookup */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5" /> Find Your Account
              </h2>
              <p className="text-gray-400 text-sm">
                Enter your Registration ID. If you&apos;re registered,
                we&apos;ll pre-fill your details.
              </p>
              <div>
                <input
                  type="text"
                  value={lookupValue}
                  onChange={(e) => setLookupValue(e.target.value)}
                  placeholder="Registration ID (e.g. LFF-XXXXX)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleLookup}
                  disabled={lookingUp || !lookupValue.trim()}
                  className="flex-1 btn-primary py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {lookingUp ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4" /> Look Up
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold hover:bg-white/20 transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Step 2: User Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Your Details</h2>

              {foundUser && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-green-300 text-sm">
                    Welcome back, <strong>{foundUser.fullName}</strong>! Your
                    details have been pre-filled.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="08012345678"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/20"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!name || !email || !phone}
                  className="flex-1 btn-primary py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Choose Room <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Select Accommodation */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">
                Select Accommodation
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : accommodations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No accommodations available at this time.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {accommodations.map((acc, idx) => {
                    const isSoldOut = acc.isFullyBooked;
                    return (
                      <button
                        key={idx}
                        onClick={() => !isSoldOut && setSelectedAccommodation(acc)}
                        disabled={isSoldOut}
                        className={`relative w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isSoldOut
                            ? "border-red-900/30 bg-red-950/20 opacity-60 cursor-not-allowed"
                            : selectedAccommodation?.name === acc.name
                            ? "border-primary bg-primary/10"
                            : "border-white/10 bg-white/5 hover:border-white/30"
                        }`}
                      >
                        {isSoldOut && (
                          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                            SOLD OUT
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-bold ${isSoldOut ? "text-gray-400 line-through" : "text-white"}`}>
                              {acc.name}
                            </p>
                            {acc.duration && (
                              <p className="text-xs text-gray-400 mt-1">
                                {acc.duration}
                              </p>
                            )}
                            {acc.description && (
                              <p className="text-sm text-gray-400 mt-1">
                                {acc.description}
                              </p>
                            )}
                          </div>
                          <p className={`text-lg font-black ${isSoldOut ? "text-gray-500" : "text-primary"}`}>
                            {formatPrice(acc.price)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/20"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedAccommodation}
                  className="flex-1 btn-primary py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Pay <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Pay with Paystack */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Complete Payment
              </h2>

              {/* Booking Summary */}
              {selectedAccommodation && (
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Booking Summary</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-lg">{selectedAccommodation.name}</p>
                      {selectedAccommodation.duration && (
                        <p className="text-xs text-gray-400 mt-0.5">{selectedAccommodation.duration}</p>
                      )}
                    </div>
                    <p className="text-2xl font-black text-primary">{formatPrice(selectedAccommodation.price)}</p>
                  </div>
                  <div className="border-t border-white/10 pt-3 space-y-1">
                    <p className="text-sm text-gray-300"><span className="text-gray-500">Name:</span> {name}</p>
                    <p className="text-sm text-gray-300"><span className="text-gray-500">Email:</span> {email}</p>
                    <p className="text-sm text-gray-300"><span className="text-gray-500">Phone:</span> {phone}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  disabled={paying}
                  className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/20 disabled:opacity-50"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={handlePayWithPaystack}
                  disabled={paying}
                  className="flex-1 btn-primary py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Redirecting…
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" /> Pay with Paystack
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                You will be redirected to Paystack to complete your payment securely.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookAccommodationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <BookAccommodationContent />
    </Suspense>
  );
}
