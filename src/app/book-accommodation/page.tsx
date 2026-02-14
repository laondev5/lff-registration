"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle,
  Search,
  User,
  Mail,
  Phone,
  Upload,
  Building2,
  Home,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";

interface Accommodation {
  id?: string;
  name: string;
  price: string;
  duration?: string;
  description?: string;
}

interface PaymentAccount {
  accountName: string;
  accountNumber: string;
  bankName: string;
  type: string;
}

interface UserInfo {
  uniqueId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export default function BookAccommodationPage() {
  const [step, setStep] = useState(1); // 1: Lookup, 2: Details, 3: Select Accommodation, 4: Payment, 5: Upload Proof
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

  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(
    null,
  );
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [copied, setCopied] = useState(false);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState("");

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

  // Fetch payment account when reaching step 4
  useEffect(() => {
    if (step === 4) {
      setLoadingAccount(true);
      fetch("/api/payment-account?type=accommodation")
        .then((res) => res.json())
        .then((data) => setPaymentAccount(data.account))
        .catch((err) => console.error(err))
        .finally(() => setLoadingAccount(false));
    }
  }, [step]);

  const handleLookup = async () => {
    if (!lookupValue.trim()) return;
    setLookingUp(true);
    try {
      const res = await fetch("/api/lookup-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: lookupValue.trim() }),
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

  const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitBooking = async () => {
    if (!selectedAccommodation || !name || !email || !phone) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("accommodationType", selectedAccommodation.name);
      formData.append("accommodationId", selectedAccommodation.id || "");
      formData.append("amount", selectedAccommodation.price);
      if (foundUser?.uniqueId) formData.append("uniqueId", foundUser.uniqueId);
      if (proofFile) formData.append("file", proofFile);

      const res = await fetch("/api/booking-requests", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        setBookingId(result.id);
        setSuccess(true);
      } else {
        alert("Booking failed: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-white/10 rounded-2xl p-8 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Booking Submitted!
          </h2>
          <p className="text-gray-400 mb-2">
            Your booking ID is{" "}
            <strong className="text-primary">{bookingId}</strong>.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            {proofFile
              ? "Your payment proof has been uploaded. We'll review and confirm your booking soon."
              : "Please complete payment and contact us with proof of payment."}
          </p>
          <Link href="/" className="btn-primary inline-flex items-center">
            Return Home
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
          {[1, 2, 3, 4, 5].map((s) => (
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
                Enter your email or phone number. If you&apos;re registered,
                we&apos;ll pre-fill your details.
              </p>
              <div>
                <input
                  type="text"
                  value={lookupValue}
                  onChange={(e) => setLookupValue(e.target.value)}
                  placeholder="Email or phone number"
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
                  {accommodations.map((acc, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedAccommodation(acc)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedAccommodation?.name === acc.name
                          ? "border-primary bg-primary/10"
                          : "border-white/10 bg-white/5 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{acc.name}</p>
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
                        <p className="text-lg font-black text-primary">
                          ₦{parseInt(acc.price).toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
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
                  Payment <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment Info */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Payment Information
              </h2>

              {/* Selected Accommodation Summary */}
              {selectedAccommodation && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-gray-400">You&apos;re booking:</p>
                  <p className="text-lg font-bold text-white">
                    {selectedAccommodation.name}
                  </p>
                  <p className="text-2xl font-black text-primary mt-1">
                    ₦{parseInt(selectedAccommodation.price).toLocaleString()}
                  </p>
                </div>
              )}

              {loadingAccount ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : paymentAccount ? (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 space-y-3">
                  <p className="text-sm text-primary font-medium">
                    Transfer to:
                  </p>
                  <div>
                    <p className="text-xs text-gray-400">Bank</p>
                    <p className="text-lg font-bold text-white">
                      {paymentAccount.bankName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Account Number</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-white tracking-widest">
                        {paymentAccount.accountNumber}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(paymentAccount.accountNumber)
                        }
                        className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-gray-300"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Account Name</p>
                    <p className="text-lg font-semibold text-white">
                      {paymentAccount.accountName}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No payment account configured. Contact admin.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/20"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 btn-primary py-3 font-bold flex items-center justify-center gap-2"
                >
                  Upload Proof <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Upload Proof & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5" /> Upload Payment Proof
              </h2>

              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                {proofPreview ? (
                  <div className="space-y-4">
                    <img
                      src={proofPreview}
                      alt="Proof"
                      className="max-h-40 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-gray-400">{proofFile?.name}</p>
                    <button
                      onClick={() => {
                        setProofFile(null);
                        setProofPreview(null);
                      }}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Remove & choose another
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-300 font-medium">
                      Click to upload payment proof
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, or PDF
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleProofSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center">
                You can also submit without proof and send it later.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/20"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={handleSubmitBooking}
                  disabled={submitting}
                  className="flex-1 btn-primary py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit Booking <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
