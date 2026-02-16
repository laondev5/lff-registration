"use client";

import { useState, useEffect } from "react";
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
  Upload,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SuccessAnimation } from "./SuccessAnimation";

const TITLES = [
  "Bro",
  "Sis",
  "Minister",
  "Elders",
  "Jnr Dcn",
  "Jnr Dcns",
  "Snr Dcn",
  "Snr Dcns",
  "Pastor",
];

const REGISTRATION_TYPES = [
  { label: "Regular & Exhorted", amount: "1,000", value: "regular" },
  { label: "Deacon & Deaconess", amount: "2,000", value: "deacon" },
  {
    label: "Elders, Ministers & Pastors",
    amount: "3,000",
    value: "elders_ministers_pastors",
  },
  {
    label: "Convention Partner",
    amount: "10,000",
    value: "convention_partner",
  },
];

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
  { icon: CreditCard, label: "Registration" },
];

interface PaymentAccount {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export function RegistrationForm() {
  const { currentStep, setStep, nextStep, prevStep, updateData, data } =
    useRegistrationStore();
  const router = useRouter();
  const [submittingType, setSubmittingType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRegType, setSelectedRegType] = useState<string>(
    data.registrationType || "",
  );
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(
    null,
  );
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [paymentUploaded, setPaymentUploaded] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    // Fetch registration payment account
    fetch("/api/payment-accounts?type=registration")
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.account) {
          setPaymentAccount(result.account);
        }
      })
      .catch(() => {});
  }, []);

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
    nextStep(); // Go to registration type step (step 3)
  };

  const onSubmitRegistration = async () => {
    if (!selectedRegType) {
      alert("Please select a registration type");
      return;
    }

    const regType = REGISTRATION_TYPES.find((r) => r.value === selectedRegType);
    updateData({
      registrationType: selectedRegType,
      registrationAmount: regType?.amount || "",
    });

    setIsSubmitting(true);

    const mergedData = {
      ...data,
      registrationType: selectedRegType,
      registrationAmount: regType?.amount || "",
    };

    const finalData = {
      title: mergedData.title,
      fullName: mergedData.fullName,
      email: mergedData.email,
      phoneNumber: mergedData.phoneNumber,
      whatsapp: mergedData.whatsapp,
      gender: mergedData.gender,
      isLFFMember: mergedData.isLFFMember,
      churchDetails: mergedData.churchDetails,
      areaDistrict: mergedData.areaDistrict,
      state: mergedData.state,
      country: mergedData.country,
      attendanceType: mergedData.attendanceType,
      busInterest: mergedData.busInterest,
      mealCollection: mergedData.mealCollection,
      prayerRequest: mergedData.prayerRequest,
      needsAccommodation: mergedData.needsAccommodation,
      registrationType: selectedRegType,
      registrationAmount: regType?.amount || "",
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      if (result.success) {
        updateData({ uniqueId: result.uniqueId });
        nextStep(); // Go to success/payment screen (step 4)
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      alert("Error submitting form: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentUpload = async () => {
    if (!paymentFile || !data.uniqueId) {
      setPaymentError("Please select a file.");
      return;
    }

    setUploadingPayment(true);
    setPaymentError("");

    const formData = new FormData();
    formData.append("file", paymentFile);
    formData.append("uniqueId", data.uniqueId);
    formData.append("type", "registration");

    try {
      const response = await fetch("/api/upload-payment", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      setPaymentUploaded(true);
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.message || "An error occurred during upload.");
    } finally {
      setUploadingPayment(false);
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
        // setSubmittingType(null);
        // alert("Thank you for registering! See you at GAC 2026!");
        // router.push("/");

        // Redirect to department selection
        router.push(`/join-department?id=${data.uniqueId}`);
      }
    }, 500);
  };

  // ─── Rendering ─────────────────────────────────────

  // For steps 4 & 5 (success/payment + accommodation), hide the stepper
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
              {/* <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">📞</span> */}
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
              {/* <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">📱</span> */}
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

      {/* ─── Step 3: Registration Type ──────── */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Registration Type
            </h3>
            <p className="text-gray-500 text-sm">
              Select your registration category. Payment will be required to
              complete registration.
            </p>
          </div>

          <div className="space-y-3">
            {REGISTRATION_TYPES.map((type) => (
              <label
                key={type.value}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRegType === type.value
                    ? "border-primary bg-primary/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="registrationType"
                    value={type.value}
                    checked={selectedRegType === type.value}
                    onChange={(e) => setSelectedRegType(e.target.value)}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-white font-medium">{type.label}</span>
                </div>
                <span className="text-primary font-bold">N{type.amount}</span>
              </label>
            ))}
          </div>

          <div className="pt-4 flex justify-between">
            <button type="button" onClick={prevStep} className="btn-ghost">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <button
              onClick={onSubmitRegistration}
              disabled={isSubmitting || !selectedRegType}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Submitting...
                </>
              ) : (
                <>
                  Submit Registration <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Success + Payment ──────── */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-in fade-in duration-500 py-4">
          {!paymentUploaded ? (
            <>
              <SuccessAnimation
                name={data.fullName}
                uniqueId={data.uniqueId || "N/A"}
              />

              <div className="border border-white/10 rounded-xl p-6 bg-white/5">
                <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> Complete Your
                  Payment
                </h4>
                <p className="text-gray-400 text-sm mb-4">
                  Registration is not complete without payment. Please transfer{" "}
                  <span className="text-primary font-bold">
                    N
                    {data.registrationAmount ||
                      REGISTRATION_TYPES.find(
                        (r) => r.value === selectedRegType,
                      )?.amount}
                  </span>{" "}
                  to the account below:
                </p>

                {paymentAccount ? (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Bank:</span>
                      <span className="text-white font-medium">
                        {paymentAccount.bankName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">
                        Account Number:
                      </span>
                      <span className="text-white font-bold text-lg">
                        {paymentAccount.accountNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">
                        Account Name:
                      </span>
                      <span className="text-white font-medium">
                        {paymentAccount.accountName}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                    <p className="text-yellow-400 text-sm">
                      Payment account details not available yet. Please check
                      back or contact the admin.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-gray-300 text-sm font-medium">
                    Upload proof of payment:
                  </p>
                  <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-white/5">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPaymentFile(e.target.files[0]);
                          setPaymentError("");
                        }
                      }}
                      className="hidden"
                      id="reg-payment-upload"
                    />
                    <label
                      htmlFor="reg-payment-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-primary" />
                      <p className="text-sm text-white">
                        {paymentFile
                          ? paymentFile.name
                          : "Click to select file"}
                      </p>
                      <p className="text-xs text-gray-500">JPG, PNG, or PDF</p>
                    </label>
                  </div>

                  {paymentError && (
                    <p className="text-red-400 text-xs text-center">
                      {paymentError}
                    </p>
                  )}

                  <button
                    onClick={handlePaymentUpload}
                    disabled={!paymentFile || uploadingPayment}
                    className="w-full btn-primary py-3 font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Uploading...
                      </>
                    ) : (
                      "Upload Payment Proof"
                    )}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => nextStep()}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Skip — I&apos;ll pay later
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Payment Proof Uploaded!
                </h3>
                <p className="text-gray-400">
                  Your payment will be verified by the admin. Thank you!
                </p>
              </div>
              <button
                onClick={() => nextStep()}
                className="btn-primary text-lg px-8 py-3"
              >
                Continue <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          )}
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

          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-lg mx-auto">
            <button
              onClick={() => handleAccommodationChoice(true, "book")}
              disabled={!!submittingType}
              className="flex-1 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:scale-[1.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {submittingType === "book" ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : null}
              Yes, Book Now
            </button>
            <button
              onClick={() => handleAccommodationChoice(false, "skip")}
              disabled={!!submittingType}
              className="flex-1 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submittingType === "skip" ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : null}
              No, Thank You
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
