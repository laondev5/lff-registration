"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- Form Validation Schemas (Simplified version of RegistrationForm) ---
const TITLES = [
  "Child", "Teenager", "Bro", "Sis", "Exhorter", "Deacon", "Deaconess", 
  "Snr Deacon", "Snr Deaconess", "Pastor", "District Pastor", "Elders", 
  "Minister", "VIP",
];

const recoveryFormSchema = z.object({
  title: z.string().min(1, "Please select a title"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  phoneNumber: z.string().min(10, "Valid phone number required"),
  whatsapp: z.string().min(10, "Valid WhatsApp number required"),
  gender: z.enum(["male", "female"]),
  isLFFMember: z.enum(["yes", "no"]),
  churchDetails: z.string().min(2, "Church details are required"),
  areaDistrict: z.string().min(2, "Area/District is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  attendanceType: z.enum(["physical", "virtual"]),
  busInterest: z.enum(["yes", "no"]),
  mealCollection: z.string().min(1, "Meal collection point required"),
});

type RecoveryFormData = z.infer<typeof recoveryFormSchema>;

export default function VerifyPaymentPage() {
  const [reference, setReference] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  
  // State for the recovery form
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [recoveredMetadata, setRecoveredMetadata] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    watch,
  } = useForm<RecoveryFormData>({
    resolver: zodResolver(recoveryFormSchema),
    mode: "onChange",
  });

  const watchIsLffMember = watch("isLFFMember");

  const handleVerify = async () => {
    if (!reference.trim()) {
      setError("Please enter a payment reference");
      return;
    }

    setIsVerifying(true);
    setError("");
    setResult(null);
    setShowRecoveryForm(false);
    setRecoveredMetadata(null);

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

      if (data.success && data.metadata && data.metadata.registrationData) {
        // We found an incomplete registration!
        setRecoveredMetadata(data.metadata);
        
        // Pre-populate form with whatever data we got from Paystack
        const regData = data.metadata.registrationData;
        reset({
          title: regData.title || "",
          fullName: regData.fullName || "",
          email: regData.email || "",
          phoneNumber: regData.phoneNumber || "",
          whatsapp: regData.whatsapp || "",
          gender: regData.gender || undefined,
          isLFFMember: regData.isLFFMember || undefined,
          churchDetails: regData.churchDetails || "",
          areaDistrict: regData.areaDistrict || "",
          state: regData.state || "",
          country: regData.country || "",
          attendanceType: regData.attendanceType || undefined,
          busInterest: regData.busInterest || undefined,
          mealCollection: regData.mealCollection || "",
        });
        
        setShowRecoveryForm(true);
      } else {
        // Just show the generic success (maybe it's not a registration payment)
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmitRecovery = async (formData: RecoveryFormData) => {
    setIsSubmitting(true);
    setError("");

    try {
      // Merge with any original metadata we didn't capture in the form 
      const originalRegData = recoveredMetadata.registrationData || {};
      
      const res = await fetch('/api/paystack/recover-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.trim(),
          registrationData: {
            ...originalRegData, // keep hidden fields like uniqueId or needsAccommodation
            ...formData,        // overwrite with new form data
          }
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Recovery failed");
      }

      // Success! Hide form and show result
      setShowRecoveryForm(false);
      setResult(data);
      
    } catch (err: any) {
      setError(err.message || "Failed to save recovered registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className={`w-full ${showRecoveryForm ? 'max-w-2xl' : 'max-w-md'} transition-all duration-300`}>
        <Link
          href="/"
          className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {showRecoveryForm ? (
          <div className="bg-black/80 backdrop-blur-xl border border-primary/30 rounded-2xl p-6 md:p-8 shadow-2xl shadow-primary/10">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle className="text-green-400" /> Payment Found!
            </h2>
            <p className="text-gray-300 mb-6 text-sm">
              We found your payment of ₦{((recoveredMetadata?.registrationData?.registrationAmount) || "0")} on Paystack. 
              Please review and complete any missing information below to finalize your registration and receive your QR code.
            </p>

            <form onSubmit={handleSubmit(onSubmitRecovery)} className="space-y-6">
              {/* Personal Info */}
              <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-primary font-semibold text-sm uppercase tracking-wider">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Title *</label>
                    <select {...register("title")} className="form-input text-sm py-2">
                      <option value="">Select title</option>
                      {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.title && <p className="text-red-400 text-xs">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Full Name *</label>
                    <input {...register("fullName")} className="form-input text-sm py-2" />
                    {errors.fullName && <p className="text-red-400 text-xs">{errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Email *</label>
                    <input type="email" {...register("email")} className="form-input text-sm py-2" />
                    {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Gender *</label>
                    <div className="flex gap-4 mt-2">
                      <label className="radio-option"><input type="radio" {...register("gender")} value="male" className="accent-primary" /> <span>Male</span></label>
                      <label className="radio-option"><input type="radio" {...register("gender")} value="female" className="accent-primary" /> <span>Female</span></label>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Phone *</label>
                    <input {...register("phoneNumber")} className="form-input text-sm py-2" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">WhatsApp *</label>
                    <input {...register("whatsapp")} className="form-input text-sm py-2" />
                  </div>
                </div>
              </div>

              {/* Church Info */}
              <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-primary font-semibold text-sm uppercase tracking-wider">Church & Location</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">LFF Member? *</label>
                    <div className="flex gap-4">
                      <label className="radio-option"><input type="radio" {...register("isLFFMember")} value="yes" className="accent-primary" /> <span>Yes</span></label>
                      <label className="radio-option"><input type="radio" {...register("isLFFMember")} value="no" className="accent-primary" /> <span>No</span></label>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">
                      {watchIsLffMember === "yes" ? "State church name, District and State *" : "State your church name *"}
                    </label>
                    <input {...register("churchDetails")} className="form-input text-sm py-2" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">Area/District *</label>
                      <input {...register("areaDistrict")} className="form-input text-sm py-2" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">State *</label>
                      <input {...register("state")} className="form-input text-sm py-2" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">Country *</label>
                      <input {...register("country")} className="form-input text-sm py-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences Details */}
              <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-primary font-semibold text-sm uppercase tracking-wider">Event Preferences</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                      <label className="text-xs text-gray-400">Attendance Type *</label>
                      <div className="flex gap-4 mt-2">
                        <label className="radio-option"><input type="radio" {...register("attendanceType")} value="physical" className="accent-primary" /> <span>Physical</span></label>
                        <label className="radio-option"><input type="radio" {...register("attendanceType")} value="virtual" className="accent-primary" /> <span>Virtual</span></label>
                      </div>
                    </div>
                     <div className="space-y-1">
                      <label className="text-xs text-gray-400">Follow Buses? *</label>
                      <div className="flex gap-4 mt-2">
                        <label className="radio-option"><input type="radio" {...register("busInterest")} value="yes" className="accent-primary" /> <span>Yes</span></label>
                        <label className="radio-option"><input type="radio" {...register("busInterest")} value="no" className="accent-primary" /> <span>No</span></label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Meal Collection Point *</label>
                    <select {...register("mealCollection")} className="form-input text-sm py-2">
                      <option value="">Select point</option>
                      {["Media", "Choir", "Technical", "District", "Non-members/Others"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm flex items-center gap-2"><XCircle className="w-4 h-4" /> {error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecoveryForm(false)}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="flex-1 bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                  ) : (
                    <>Submit Information & Receive Code <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
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
                    <Search className="w-5 h-5" /> Verify Payment
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
                      {result.alreadyProcessed
                        ? "Already Confirmed!"
                        : result.recovered
                          ? "Registration Recovered!"
                          : "Payment Verified!"}
                    </p>
                    <p className="text-green-400/80 text-xs mt-1">
                      {result.message}
                    </p>

                    {result.data?.uniqueId && (
                      <div className="mt-3 p-3 bg-white/5 rounded-lg">
                        <p className="text-gray-300 text-xs">
                          <span className="text-gray-500">Registration ID:</span>{" "}
                          <span className="font-mono font-bold">
                            {result.data.uniqueId}
                          </span>
                        </p>
                        <p className="text-green-400/80 text-xs mt-2 italic">
                          A confirmation email has been sent to your email address with your QR code.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-gray-600 text-xs text-center mt-4">
          If you continue having issues, please contact support with your
          payment reference.
        </p>
      </div>
    </div>
  );
}
