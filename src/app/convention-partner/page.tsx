"use client";

import { useState } from "react";
import { Loader2, Heart, IdCard, CreditCard, ChevronLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ConventionPartnerPage() {
  const [registrationId, setRegistrationId] = useState("");
  const [amount, setAmount] = useState("10000");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [step, setStep] = useState<"lookup" | "donate">("lookup");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationId.trim()) {
      setError("Please enter your Registration ID.");
      return;
    }

    setLookupLoading(true);
    setError("");

    try {
      const res = await fetch("/api/lookup-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idOrEmail: registrationId.trim() }),
      });
      const data = await res.json();

      if (data.found && data.user) {
        setUserData(data.user);
        setStep("donate");
      } else {
        setError("No registration found with this ID. You must register first before becoming a Convention Partner.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleDonate = async () => {
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount < 10000) {
      setError("Minimum contribution is ₦10,000.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.email,
          amount: numAmount,
          type: "registration",
          metadata: {
            fullName: userData.fullName,
            regType: "convention_partner",
            isConventionPartner: true,
            uniqueId: userData.uniqueId,
            conventionPartnerAmount: numAmount,
          },
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      window.location.href = data.data.authorization_url;
    } catch (err: any) {
      setError(err.message || "Failed to initialize payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400/20 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Convention Partner
            </h1>
            <p className="text-gray-400">
              Support the GAC 2026 convention by becoming a partner.
              Your generous contribution helps make this event possible.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-card border border-white/10 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-amber-400 mb-3">
            Partner Benefits
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-gray-300 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              Official recognition as a Convention Partner
            </li>
            <li className="flex items-center gap-2 text-gray-300 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              Contributing to the success of GAC 2026
            </li>
            <li className="flex items-center gap-2 text-gray-300 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              Minimum contribution: ₦10,000
            </li>
          </ul>
        </div>

        {/* Step: Lookup */}
        {step === "lookup" && (
          <div className="bg-card border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <IdCard className="w-5 h-5 text-primary" />
              Find Your Registration
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Enter your Registration ID to continue.
            </p>

            <form onSubmit={handleLookup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">
                  Registration ID
                </label>
                <input
                  type="text"
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  className="form-input"
                  placeholder="e.g. LFF-XXXXX"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                  {error}
                  {error.includes("register first") && (
                    <div className="mt-2">
                      <Link href="/" className="text-primary hover:underline font-medium">
                        → Go to Registration
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={lookupLoading || !registrationId.trim()}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {lookupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Looking up...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step: Donate */}
        {step === "donate" && userData && (
          <div className="bg-card border border-white/10 rounded-xl p-6 space-y-5">
            {/* User info */}
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Registering as</p>
              <p className="text-white font-bold">{userData.fullName}</p>
              <p className="text-gray-400 text-sm">{userData.email}</p>
              <p className="text-xs text-gray-500 mt-1">ID: {userData.uniqueId}</p>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Contribution Amount (₦)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input text-xl font-bold text-center"
                min={10000}
                step={1000}
              />
              <p className="text-xs text-gray-500 text-center">
                Minimum: ₦10,000
              </p>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-3 gap-2">
              {["10000", "20000", "50000"].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    amount === val
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  ₦{parseInt(val).toLocaleString()}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleDonate}
              disabled={loading || parseInt(amount) < 10000}
              className="w-full bg-gradient-to-r from-amber-500 to-primary text-black py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay ₦{parseInt(amount || "0").toLocaleString()} with Paystack
                </>
              )}
            </button>

            <button
              onClick={() => {
                setStep("lookup");
                setUserData(null);
                setError("");
              }}
              className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
            >
              ← Use a different ID
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
