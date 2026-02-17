"use client";

import { useState, useEffect, useMemo } from "react";
import { useRegistrationStore } from "@/store/useRegistrationStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
  Church,
  Calendar,
  CreditCard,
  CheckCircle,
  UserPlus,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { SuccessAnimation } from "./SuccessAnimation";

// ─── Title → Registration Fee Mapping ──────────────────
const TITLES = [
  "Bro",
  "Sis",
  "Jnr Dcn",
  "Jnr Dcns",
  "Snr Dcn",
  "Snr Dcns",
  "Pastor",
  "Elders",
  "Minister",
];

const TITLE_TO_REG: Record<
  string,
  { type: string; label: string; amount: number }
> = {
  Bro: { type: "regular", label: "Regular & Exhorted", amount: 1000 },
  Sis: { type: "regular", label: "Regular & Exhorted", amount: 1000 },
  "Jnr Dcn": { type: "deacon", label: "Deacon & Deaconess", amount: 2000 },
  "Jnr Dcns": { type: "deacon", label: "Deacon & Deaconess", amount: 2000 },
  "Snr Dcn": { type: "deacon", label: "Deacon & Deaconess", amount: 2000 },
  "Snr Dcns": { type: "deacon", label: "Deacon & Deaconess", amount: 2000 },
  Pastor: {
    type: "elders_ministers_pastors",
    label: "Elders, Ministers & Pastors",
    amount: 3000,
  },
  Elders: {
    type: "elders_ministers_pastors",
    label: "Elders, Ministers & Pastors",
    amount: 3000,
  },
  Minister: {
    type: "elders_ministers_pastors",
    label: "Elders, Ministers & Pastors",
    amount: 3000,
  },
};

const CONVENTION_PARTNER = {
  type: "convention_partner",
  label: "Convention Partner",
  amount: 10000,
};

// ─── Schemas ──────────────────────────────────────────
const personalInfoSchema = z.object({
  title: z.string().min(1, "Please select a title"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  phoneNumber: z.string().min(10, "Valid phone number required"),
  whatsapp: z.string().min(10, "Valid WhatsApp number required"),
  gender: z.enum(["male", "female"]),
});

const churchLocationSchema = z.object({
  isLFFMember: z.enum(["yes", "no"]),
  churchDetails: z.string().min(2, "Church details are required"),
  areaDistrict: z.string().min(2, "Area/District is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
});

const preferencesSchema = z.object({
  attendanceType: z.enum(["physical", "virtual"]),
  busInterest: z.enum(["yes", "no"]),
  mealCollection: z.string().min(1, "Please select a meal collection point"),
  prayerRequest: z.string().optional(),
});

type PersonalInfo = z.infer<typeof personalInfoSchema>;
type ChurchLocation = z.infer<typeof churchLocationSchema>;
type Preferences = z.infer<typeof preferencesSchema>;

// ─── Step Labels ──────────────────────────────────────
const stepLabels = [
  { icon: User, label: "Personal" },
  { icon: Church, label: "Church" },
  { icon: Calendar, label: "Preferences" },
  { icon: CreditCard, label: "Confirm & Pay" },
];

export function RegistrationForm() {
  const { currentStep, setStep, nextStep, prevStep, updateData, data, reset } =
    useRegistrationStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submittingType, setSubmittingType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConventionPartner, setIsConventionPartner] = useState(false);
  const [paymentAccount, setPaymentAccount] = useState<any>(null);

  // Fetch registration account script
  useEffect(() => {
    if (currentStep === 3) {
      fetch("/api/payment-account?type=registration")
        .then((res) => res.json())
        .then((data) => setPaymentAccount(data.account))
        .catch((err) => console.error("Failed to fetch account:", err));
    }
  }, [currentStep]);

  // Check if we returned from a successful Paystack payment
  useEffect(() => {
    const status = searchParams.get("status");
    const uniqueId = searchParams.get("uniqueId");
    if (status === "success" && uniqueId) {
      updateData({ uniqueId });
      setStep(4); // Go to success screen
    }
  }, [searchParams, setStep, updateData]);

  // Determine registration info from title
  const registrationInfo = useMemo(() => {
    if (isConventionPartner) return CONVENTION_PARTNER;
    return TITLE_TO_REG[data.title] || null;
  }, [data.title, isConventionPartner]);

  // ─── Step 0: Personal Info Form ─────────────────────
  const {
    register: regPersonal,
    handleSubmit: submitPersonal,
    formState: { errors: errPersonal },
  } = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      title: data.title || undefined,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      whatsapp: data.whatsapp,
      gender: data.gender || undefined,
    },
  });

  // ─── Step 1: Church & Location Form ─────────────────
  const {
    register: regChurch,
    handleSubmit: submitChurch,
    formState: { errors: errChurch },
    watch: watchChurch,
  } = useForm<ChurchLocation>({
    resolver: zodResolver(churchLocationSchema),
    defaultValues: {
      isLFFMember: data.isLFFMember || undefined,
      churchDetails: data.churchDetails,
      areaDistrict: data.areaDistrict,
      state: data.state,
      country: data.country,
    },
  });

  const isLFFMember = watchChurch("isLFFMember");

  // ─── Step 2: Preferences Form ──────────────────────
  const {
    register: regPref,
    handleSubmit: submitPref,
    formState: { errors: errPref },
  } = useForm<Preferences>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      attendanceType: data.attendanceType || undefined,
      busInterest: data.busInterest || undefined,
      mealCollection: data.mealCollection,
      prayerRequest: data.prayerRequest,
    },
  });

  // ─── Handlers ──────────────────────────────────────
  const onNextPersonal = (formData: PersonalInfo) => {
    updateData(formData);
    nextStep();
  };

  const onNextChurch = (formData: ChurchLocation) => {
    updateData(formData);
    nextStep();
  };

  const onNextPreferences = (formData: Preferences) => {
    updateData(formData);
    nextStep(); // Go to confirmation + pay step (step 3)
  };

  // Step 3: Manual Payment Submission
  const handleManualRegistration = async () => {
    if (!registrationInfo) {
      alert("Please go back and select a title.");
      return;
    }

    setIsSubmitting(true);

    const regType = registrationInfo.type;
    const amount = registrationInfo.amount;

    // Build the full registration data
    const registrationData = {
      title: data.title,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      whatsapp: data.whatsapp,
      gender: data.gender,
      isLFFMember: data.isLFFMember,
      churchDetails: data.churchDetails,
      areaDistrict: data.areaDistrict,
      state: data.state,
      country: data.country,
      attendanceType: data.attendanceType,
      busInterest: data.busInterest,
      mealCollection: data.mealCollection,
      prayerRequest: data.prayerRequest,
      needsAccommodation: data.needsAccommodation,
      registrationType: regType,
      registrationAmount: amount.toLocaleString(),
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      updateData({ uniqueId: result.uniqueId });
      setStep(4); // Success screen
    } catch (err: any) {
      console.error("Registration error:", err);
      alert("Registration error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccommodationChoice = (
    wantsAccommodation: boolean,
    type: string,
  ) => {
    setSubmittingType(type);
    updateData({ needsAccommodation: wantsAccommodation });

    setTimeout(() => {
      if (wantsAccommodation) {
        router.push("/accommodations");
      } else {
        router.push(`/join-department?id=${data.uniqueId}`);
      }
    }, 500);
  };

  const handleRegisterAnother = () => {
    reset();
    setIsConventionPartner(false);
    setStep(0);
  };

  // ─── Rendering ─────────────────────────────────────

  // For steps 4 & 5 (success + accommodation), hide the stepper
  const showStepper = currentStep < 4;

  return (
    <div className="bg-card text-card-foreground p-6 md:p-8 rounded-xl w-full min-h-[450px] relative overflow-hidden">
      {/* ─── Progress Stepper ─────────────── */}
      {showStepper && (
        <div className="mb-8">
          <div className="flex justify-between relative">
            {stepLabels.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="z-10 flex flex-col items-center w-1/4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                      currentStep > i
                        ? "bg-green-500 text-white border-green-500"
                        : currentStep === i
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
                          : "bg-transparent border-gray-600 text-gray-500"
                    }`}
                  >
                    {currentStep > i ? "✓" : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      currentStep >= i ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
            {/* Progress line */}
            <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-gray-700 -z-0">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-primary transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 0: Personal Information ─── */}
      {currentStep === 0 && (
        <form
          onSubmit={submitPersonal(onNextPersonal)}
          className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Personal Information
            </h3>
            <p className="text-gray-500 text-sm">Tell us about yourself</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">
              Title <span className="text-red-400">*</span>
            </label>
            <select
              {...regPersonal("title")}
              className="form-input text-gray-600"
            >
              <option value="" className="text-gray-600">
                Select title
              </option>
              {TITLES.map((t) => (
                <option key={t} value={t} className="text-gray-600">
                  {t}
                </option>
              ))}
            </select>
            {errPersonal.title && (
              <p className="text-red-400 text-xs">
                {errPersonal.title.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              {...regPersonal("fullName")}
              className="form-input"
              placeholder="Enter your full name"
            />
            {errPersonal.fullName && (
              <p className="text-red-400 text-xs">
                {errPersonal.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              {...regPersonal("email")}
              type="email"
              className="form-input"
              placeholder="your.email@example.com"
            />
            {errPersonal.email && (
              <p className="text-red-400 text-xs">
                {errPersonal.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                {...regPersonal("phoneNumber")}
                className="form-input pl-10"
                placeholder="080 1234 5678"
              />
            </div>
            {errPersonal.phoneNumber && (
              <p className="text-red-400 text-xs">
                {errPersonal.phoneNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">
              WhatsApp Number <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                {...regPersonal("whatsapp")}
                className="form-input pl-10"
                placeholder="+234 800 000 0000"
              />
            </div>
            {errPersonal.whatsapp && (
              <p className="text-red-400 text-xs">
                {errPersonal.whatsapp.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Gender <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-4">
              <label className="radio-option">
                <input
                  type="radio"
                  {...regPersonal("gender")}
                  value="male"
                  className="accent-primary w-4 h-4"
                />
                <span>Male</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  {...regPersonal("gender")}
                  value="female"
                  className="accent-primary w-4 h-4"
                />
                <span>Female</span>
              </label>
            </div>
            {errPersonal.gender && (
              <p className="text-red-400 text-xs">
                {errPersonal.gender.message}
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="btn-primary">
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </form>
      )}

      {/* ─── Step 1: Church & Location ────── */}
      {currentStep === 1 && (
        <form
          onSubmit={submitChurch(onNextChurch)}
          className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Church & Location
            </h3>
            <p className="text-gray-500 text-sm">
              Your church affiliation and residence
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Are you a member of the Living Faith Foundation?{" "}
              <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-4">
              <label className="radio-option">
                <input
                  type="radio"
                  {...regChurch("isLFFMember")}
                  value="yes"
                  className="accent-primary w-4 h-4"
                />
                <span>Yes</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  {...regChurch("isLFFMember")}
                  value="no"
                  className="accent-primary w-4 h-4"
                />
                <span>No</span>
              </label>
            </div>
            {errChurch.isLFFMember && (
              <p className="text-red-400 text-xs">
                {errChurch.isLFFMember.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">
              {isLFFMember === "yes"
                ? "State church name, District and State"
                : "State your church name"}{" "}
              <span className="text-red-400">*</span>
            </label>
            <input
              {...regChurch("churchDetails")}
              className="form-input"
              placeholder={
                isLFFMember === "yes"
                  ? "e.g. , Central church Kaduna, Kaduna State"
                  : "e.g. Grace Assembly"
              }
            />
            {errChurch.churchDetails && (
              <p className="text-red-400 text-xs">
                {errChurch.churchDetails.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Area/District <span className="text-red-400">*</span>
              </label>
              <input
                {...regChurch("areaDistrict")}
                className="form-input"
                placeholder="Your area or district"
              />
              {errChurch.areaDistrict && (
                <p className="text-red-400 text-xs">
                  {errChurch.areaDistrict.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                State <span className="text-red-400">*</span>
              </label>
              <input
                {...regChurch("state")}
                className="form-input"
                placeholder="Your state"
              />
              {errChurch.state && (
                <p className="text-red-400 text-xs">
                  {errChurch.state.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">
              Country <span className="text-red-400">*</span>
            </label>
            <input
              {...regChurch("country")}
              className="form-input"
              placeholder="Your country"
            />
            {errChurch.country && (
              <p className="text-red-400 text-xs">
                {errChurch.country.message}
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-between">
            <button type="button" onClick={prevStep} className="btn-ghost">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <button type="submit" className="btn-primary">
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </form>
      )}

      {/* ─── Step 2: Event Preferences ─────── */}
      {currentStep === 2 && (
        <form
          onSubmit={submitPref(onNextPreferences)}
          className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Event Preferences
            </h3>
            <p className="text-gray-500 text-sm">
              How would you like to attend GAC 2026?
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              How do you like to attend GAC 2026?{" "}
              <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-4">
              <label className="radio-option">
                <input
                  type="radio"
                  {...regPref("attendanceType")}
                  value="physical"
                  className="accent-primary w-4 h-4"
                />
                <span>Physical</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  {...regPref("attendanceType")}
                  value="virtual"
                  className="accent-primary w-4 h-4"
                />
                <span>Virtually</span>
              </label>
            </div>
            {errPref.attendanceType && (
              <p className="text-red-400 text-xs">
                {errPref.attendanceType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Would you like to follow our buses from your Area/District?{" "}
              <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-4">
              <label className="radio-option">
                <input
                  type="radio"
                  {...regPref("busInterest")}
                  value="yes"
                  className="accent-primary w-4 h-4"
                />
                <span>Yes</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  {...regPref("busInterest")}
                  value="no"
                  className="accent-primary w-4 h-4"
                />
                <span>No</span>
              </label>
            </div>
            {errPref.busInterest && (
              <p className="text-red-400 text-xs">
                {errPref.busInterest.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Where will you like to collect your meal?{" "}
              <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                "Media",
                "Choir",
                "Technical",
                "District",
                "Non-members/Others",
              ].map((option) => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    {...regPref("mealCollection")}
                    value={option}
                    className="accent-primary w-4 h-4"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {errPref.mealCollection && (
              <p className="text-red-400 text-xs">
                {errPref.mealCollection.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">
              What do you want God to do for you at GAC 2026?
            </label>
            <textarea
              {...regPref("prayerRequest")}
              className="form-input min-h-[100px] resize-none"
              placeholder="Share your prayer request..."
            />
          </div>

          <div className="pt-4 flex justify-between">
            <button type="button" onClick={prevStep} className="btn-ghost">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <button type="submit" className="btn-primary">
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </form>
      )}

      {/* ─── Step 3: Confirmation & Pay ──────── */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Confirm & Pay</h3>
            <p className="text-gray-500 text-sm">
              Review your details and complete payment to register.
            </p>
          </div>

          {/* Summary Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white font-medium">
                {data.title} {data.fullName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <span className="text-white">{data.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phone:</span>
              <span className="text-white">{data.phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Church:</span>
              <span className="text-white">{data.churchDetails}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Attendance:</span>
              <span className="text-white capitalize">
                {data.attendanceType}
              </span>
            </div>
          </div>

          {/* Registration Type (auto-determined) */}
          <div className="border border-white/10 rounded-xl p-5 bg-white/5">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">
              Registration Category
            </h4>

            {registrationInfo && !isConventionPartner && (
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary bg-primary/10 mb-3">
                <div>
                  <p className="text-white font-medium">
                    {registrationInfo.label}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Based on your title: {data.title}
                  </p>
                </div>
                <span className="text-primary font-bold text-xl">
                  ₦{registrationInfo.amount.toLocaleString()}
                </span>
              </div>
            )}

            {isConventionPartner && (
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary bg-primary/10 mb-3">
                <div>
                  <p className="text-white font-medium">
                    {CONVENTION_PARTNER.label}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Special partnership contribution
                  </p>
                </div>
                <span className="text-primary font-bold text-xl">
                  ₦{CONVENTION_PARTNER.amount.toLocaleString()}
                </span>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
              <input
                type="checkbox"
                checked={isConventionPartner}
                onChange={(e) => setIsConventionPartner(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <div>
                <span className="text-white text-sm font-medium">
                  Register as Convention Partner instead
                </span>
                <p className="text-gray-500 text-xs">₦10,000 and above</p>
              </div>
            </label>
          </div>

          {/* Pay Button */}
          {/* Payment Instructions & Submit */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Payment
              Instructions
            </h4>

            {paymentAccount ? (
              <div className="bg-white/5 p-4 rounded-lg space-y-2">
                <p className="text-gray-400 text-sm">
                  Please transfer the fee to:
                </p>
                <div>
                  <p className="text-xl font-bold text-white tracking-widest">
                    {paymentAccount.accountNumber}
                  </p>
                  <p className="text-white font-medium">
                    {paymentAccount.bankName}
                  </p>
                  <p className="text-sm text-gray-400">
                    {paymentAccount.accountName}
                  </p>
                </div>
                <p className="text-xs text-primary mt-2">
                  Use your name "{data.fullName}" as reference/remark.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-500/10 text-yellow-500 p-4 rounded-lg text-sm">
                No payment account configured. Please contact support or proceed
                if instructed.
              </div>
            )}

            <button
              onClick={handleManualRegistration}
              disabled={isSubmitting || !registrationInfo}
              className="w-full bg-[#09A5DB] hover:bg-[#088ebc] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#09A5DB]/20 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  I have made the transfer <CheckCircle className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <div className="pt-2 flex justify-start">
            <button type="button" onClick={prevStep} className="btn-ghost">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Success (after payment) ──────── */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-in fade-in duration-500 py-4">
          <SuccessAnimation
            name={data.fullName}
            uniqueId={data.uniqueId || "N/A"}
          />

          <div className="border border-white/10 rounded-xl p-6 bg-white/5 text-center space-y-3">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="text-lg font-bold text-white">
              Registration Received!
            </h4>
            <p className="text-gray-400 text-sm">
              Your registration has been received and is{" "}
              <strong>Pending Confirmation</strong>.
              <br />A confirmation email will be sent to{" "}
              <span className="text-primary font-medium">
                {data.email}
              </span>{" "}
              once your payment is verified by the admin.
            </p>
            {data.uniqueId && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 inline-block">
                <p className="text-xs text-gray-400">Your Registration ID</p>
                <p className="text-primary font-bold text-lg">
                  {data.uniqueId}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => nextStep()}
            className="w-full btn-primary py-4 text-lg font-bold"
          >
            Continue <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      )}

      {/* ─── Step 5: Accommodation Question ── */}
      {currentStep === 5 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 py-8">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              One More Thing...
            </h3>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              Would you like to book an accommodation with us for GAC 2026?
            </p>
          </div>

          <div className="flex flex-col gap-4 max-w-lg mx-auto">
            <button
              onClick={() => handleAccommodationChoice(true, "book")}
              disabled={!!submittingType}
              className="w-full bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:scale-[1.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {submittingType === "book" ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : null}
              Yes, Book Accommodation
            </button>

            <button
              onClick={() => handleAccommodationChoice(false, "skip")}
              disabled={!!submittingType}
              className="w-full bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submittingType === "skip" ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : null}
              No, Thank You
            </button>

            <button
              onClick={handleRegisterAnother}
              className="w-full bg-white/5 border border-dashed border-white/20 text-gray-300 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Register Another Person
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
