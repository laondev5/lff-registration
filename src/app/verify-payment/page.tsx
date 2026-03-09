"use client";

import { useState } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRegistrationStore } from "@/store/useRegistrationStore";

// --- Removed local form validation schemas as we will redirect to the main form ---

export default function VerifyPaymentPage() {
  const [reference, setReference] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  
  const router = useRouter(); // <-- Ensure useRouter is imported
  const updateData = useRegistrationStore((state) => state.updateData);
  const setStep = useRegistrationStore((state) => state.setStep);

  const handleVerify = async () => {
    if (!reference.trim()) {
      setError("Please enter a payment reference");
      return;
    }

    setIsVerifying(true);
    setError("");
    setResult(null);

    try {
      // First, try to just fetch metadata to see if it's an incomplete registration
      const res = await fetch(
        `/api/paystack/fetch-metadata?reference=${encodeURIComponent(reference.trim())}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Verification failed");
        return;
      }

      console.log("Paystack Metadata Fetched:", data.metadata);

      if (data.alreadyProcessed) {
        setResult(data);
        return;
      }

      if (data.autoConfirmed) {
        setResult(data);
        return;
      }

      if (data.success && data.metadata) {
        // Log to see what we're dealing with
        console.log("Processing recovered metadata:", data.metadata);

        // Check if it's a Bulk Registration
        const isBulk = data.metadata.isBulk === true || Array.isArray(data.metadata.registrationDataList);

        if (isBulk) {
          // Pre-populate sessionStorage for the bulk form to pick up
          sessionStorage.setItem('bulkRecoveryData', JSON.stringify(data.metadata));
          router.push(`/bulk-registration?recovery=true&reference=${encodeURIComponent(reference.trim())}`);
          return;
        }

        // --- Single Registration Fallbacks ---
        // Even if we don't recognize the exact metadata structure, 
        // we should route them to the main form to let them fill out the remaining details.
        const regData = data.metadata.registrationData || data.metadata || {};
        
        // Populate the global store so the main form starts pre-filled
        updateData({
          ...regData,
          email: regData.email || data.paystackCustomerEmail || "",
        });
        
        // Reset the step to the beginning so they can walk through the pre-filled form
        setStep(0);
        
        // Redirect to the main registration form with the recovery flag
        router.push(`/?recovery=true&reference=${encodeURIComponent(reference.trim())}`);
        
      } else {
        // Just show the generic success if somehow data.metadata is entirely absent, but it shouldn't be
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md transition-all duration-300">
        <Link
          href="/"
          className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2">Verify Payment</h1>
          <p className="text-gray-400 text-sm mb-6">
            Were you debited but your registration didn&apos;t go through? Enter
            your Paystack payment reference below to verify and recover your
            registration.
          </p>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Payment Reference
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. T123456789"
                />
              </div>
              <p className="text-xs text-gray-500">
                You can find this in your Paystack email receipt or bank
                statement.
              </p>
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying || !reference.trim()}
              className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" /> Verify Payment / Recover
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">
                  Verification Failed
                </p>
                <p className="text-red-400/80 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Result AFTER Recovery */}
          {result && result.success && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-400 text-sm font-medium">
                    {result.alreadyProcessed || result.autoConfirmed
                      ? "Registration Confirmed!"
                      : result.recovered
                        ? "Registration Recovered!"
                        : "Payment Verified!"}
                  </p>
                  <p className="text-green-400/80 text-xs mt-1">
                    {result.message}
                  </p>

                  {(result.data?.uniqueId || (result.data?.uniqueIds && result.data.uniqueIds.length > 0)) && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg">
                      <p className="text-gray-300 text-xs">
                        <span className="text-gray-500">Registration ID(s):</span>{" "}
                        <span className="font-mono font-bold">
                          {result.data.uniqueId || result.data.uniqueIds.join(', ')}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-gray-600 text-xs text-center mt-4">
          If you continue having issues, please contact support with your
          payment reference.
        </p>
      </div>
    </div>
  );
}
