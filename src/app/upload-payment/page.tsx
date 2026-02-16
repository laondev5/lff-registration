"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Upload,
  CheckCircle,
  Home,
  Users,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useRegistrationStore } from "@/store/useRegistrationStore";

function UploadPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uniqueId = searchParams.get("id");
  const accommodationName = searchParams.get("accommodation");
  const amountParam = searchParams.get("amount");
  const amount = amountParam ? parseFloat(amountParam) : 0;

  // Get user data from store
  const { data } = useRegistrationStore();
  const [email, setEmail] = useState(data.email || "");

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (data.email) {
      setEmail(data.email);
    }
  }, [data.email]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file || !uniqueId) {
      setError("Please select a file and ensure you have a valid ID.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uniqueId", uniqueId);
    formData.append("type", "accommodation");

    try {
      const response = await fetch("/api/upload-payment", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handlePaystackPayment = async () => {
    if (!email) {
      setError("Email is required for online payment.");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Invalid payment amount.");
      return;
    }

    setPaying(true);
    setError("");

    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount,
          type: "accommodation",
          metadata: {
            uniqueId,
            accommodationName,
            accommodationId: data.accommodationId,
          },
        }),
      });

      const payData = await res.json();
      if (!payData.success) throw new Error(payData.error);

      window.location.href = payData.data.authorization_url;
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to initialize payment.");
      setPaying(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-white/10 rounded-2xl p-8 text-center shadow-2xl animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Upload Successful!
          </h2>
          <p className="text-gray-400 mb-8">
            Your payment proof has been uploaded. An admin will review your
            booking shortly.
          </p>
          <Link
            href={`/join-department?id=${uniqueId}`}
            className="btn-primary inline-flex items-center"
          >
            <Users className="w-4 h-4 mr-2" /> Join a Department
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Your Booking
          </h1>
          <p className="text-gray-400">
            Payment for{" "}
            <span className="text-primary font-semibold">
              {accommodationName || "accommodation"}
            </span>
          </p>
          {amount > 0 && (
            <p className="text-2xl text-white font-bold mt-2">
              ₦{amount.toLocaleString()}
            </p>
          )}
        </div>

        <div className="bg-card border border-white/10 rounded-2xl p-8 shadow-xl space-y-8">
          {/* Paystack Option */}
          {amount > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Pay Online
              </h3>

              {!data.email && (
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input w-full"
                />
              )}

              <button
                onClick={handlePaystackPayment}
                disabled={paying || uploading}
                className="w-full bg-[#09A5DB] hover:bg-[#088ebc] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#09A5DB]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Pay Now <CreditCard className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#111] px-2 text-gray-500">
                    Or Upload Proof
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Check / Manual Option */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-white/5">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium text-white">
                    {file ? file.name : "Click to select file"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports JPG, PNG, PDF
                  </p>
                </div>
              </label>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading || paying}
              className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading...
                </>
              ) : (
                "Confirm Payment Proof"
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Skip this step (I'll do it later)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UploadPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      }
    >
      <UploadPaymentContent />
    </Suspense>
  );
}
