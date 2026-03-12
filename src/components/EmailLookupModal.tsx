"use client";

import { useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useRegistrationStore } from "@/store/useRegistrationStore";

interface EmailLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFound: () => void;
}

export function EmailLookupModal({ isOpen, onClose, onFound }: EmailLookupModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { updateData } = useRegistrationStore();

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your Registration ID or Email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/lookup-user?query=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data.success && data.user) {
        // Save user data to Zustand store (persisted to localStorage)
        updateData({
          uniqueId: data.user.uniqueId,
          title: data.user.title || "",
          fullName: data.user.fullName || "",
          email: data.user.email || "",
          phoneNumber: data.user.phoneNumber || "",
          whatsapp: data.user.whatsapp || "",
          gender: data.user.gender || "",
          isLFFMember: data.user.isLFFMember || "",
          churchDetails: data.user.churchDetails || "",
          areaDistrict: data.user.areaDistrict || "",
          state: data.user.state || "",
          country: data.user.country || "",
          attendanceType: data.user.attendanceType || "",
          busInterest: data.user.busInterest || "",
          mealCollection: data.user.mealCollection || "",
          prayerRequest: data.user.prayerRequest || "",
          registrationType: data.user.registrationType || "",
          registrationAmount: data.user.registrationAmount || "",
        });

        onFound();
      } else {
        setError("No registration found with this ID or Email. Please register first.");
      }
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      console.error("Lookup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Already Registered?
          </h2>
          <p className="text-gray-400 text-sm">
            Enter the Registration ID or Email you used during registration to continue booking your accommodation.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">
              Registration ID or Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="LFF-... or your.email@example.com"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Looking up...
              </>
            ) : (
              "Find My Registration"
            )}
          </button>

          <div className="text-center">
            <p className="text-gray-500 text-xs">
              Not registered yet?{" "}
              <a href="/" className="text-primary hover:underline font-medium">
                Register here
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
