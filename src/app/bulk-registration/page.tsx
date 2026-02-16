"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  CreditCard,
  Users,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

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

interface Registrant {
  id: string;
  title: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsapp: string;
  gender: string;
  isLFFMember: string;
  churchDetails: string;
  areaDistrict: string;
  state: string;
  country: string;
  attendanceType: string;
  busInterest: string;
  mealCollection: string;
  prayerRequest: string;
  needsAccommodation: boolean;
}

const emptyRegistrant = (): Registrant => ({
  id: crypto.randomUUID(),
  title: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  whatsapp: "",
  gender: "",
  isLFFMember: "",
  churchDetails: "",
  areaDistrict: "",
  state: "",
  country: "",
  attendanceType: "",
  busInterest: "",
  mealCollection: "",
  prayerRequest: "",
  needsAccommodation: false,
});

export default function BulkRegistrationPage() {
  const router = useRouter();
  const [registrants, setRegistrants] = useState<Registrant[]>([
    emptyRegistrant(),
  ]);
  const [payerEmail, setPayerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addRegistrant = () => {
    const newReg = emptyRegistrant();
    setRegistrants([...registrants, newReg]);
    // New cards start expanded
    setCollapsed((prev) => ({ ...prev, [newReg.id]: false }));
  };

  const removeRegistrant = (id: string) => {
    if (registrants.length <= 1) return;
    setRegistrants(registrants.filter((r) => r.id !== id));
  };

  const updateRegistrant = (
    id: string,
    field: keyof Registrant,
    value: string | boolean,
  ) => {
    setRegistrants(
      registrants.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const getRegInfo = (title: string) => TITLE_TO_REG[title] || null;

  const { totalAmount, breakdown } = useMemo(() => {
    let total = 0;
    const counts: Record<string, { count: number; amount: number }> = {};

    registrants.forEach((r) => {
      const info = getRegInfo(r.title);
      if (info) {
        total += info.amount;
        if (!counts[info.label]) {
          counts[info.label] = { count: 0, amount: info.amount };
        }
        counts[info.label].count++;
      }
    });

    return { totalAmount: total, breakdown: counts };
  }, [registrants]);

  const isValid = useMemo(() => {
    if (!payerEmail || !payerEmail.includes("@")) return false;
    return registrants.every(
      (r) =>
        r.title &&
        r.fullName.length >= 2 &&
        r.email.includes("@") &&
        r.phoneNumber.length >= 10 &&
        r.whatsapp.length >= 10 &&
        r.gender &&
        r.isLFFMember &&
        r.churchDetails.length >= 2 &&
        r.areaDistrict.length >= 2 &&
        r.state.length >= 2 &&
        r.country.length >= 2 &&
        r.attendanceType &&
        r.busInterest &&
        r.mealCollection,
    );
  }, [registrants, payerEmail]);

  const handlePay = async () => {
    if (!isValid) {
      setError("Please fill in all required fields for every registrant.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const registrationDataList = registrants.map((r) => {
        const info = getRegInfo(r.title)!;
        return {
          title: r.title,
          fullName: r.fullName,
          email: r.email,
          phoneNumber: r.phoneNumber,
          whatsapp: r.whatsapp,
          gender: r.gender,
          isLFFMember: r.isLFFMember,
          churchDetails: r.churchDetails,
          areaDistrict: r.areaDistrict,
          state: r.state,
          country: r.country,
          attendanceType: r.attendanceType,
          busInterest: r.busInterest,
          mealCollection: r.mealCollection,
          prayerRequest: r.prayerRequest,
          needsAccommodation: r.needsAccommodation,
          registrationType: info.type,
          registrationAmount: info.amount.toLocaleString(),
        };
      });

      const payRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payerEmail,
          amount: totalAmount,
          type: "registration",
          metadata: {
            fullName: `Bulk Registration (${registrants.length} people)`,
            regType: "bulk",
            isBulk: true,
            registrationDataList,
          },
        }),
      });

      const payData = await payRes.json();
      if (!payData.success) throw new Error(payData.error);

      window.location.href = payData.data.authorization_url;
    } catch (err: any) {
      console.error("Bulk payment error:", err);
      setError(err.message || "Failed to initialize payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Bulk Registration
          </h1>
          <p className="text-gray-400 mt-2">
            Register multiple people at once. Pay for everyone in a single
            transaction.
          </p>
        </div>

        {/* Fee Schedule */}
        <div className="bg-card border border-white/10 rounded-xl p-5 mb-8">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Registration Fees
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-gray-400">Bro / Sis</p>
              <p className="text-primary font-bold text-lg">₦1,000</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-gray-400">Deacons / Deaconess</p>
              <p className="text-primary font-bold text-lg">₦2,000</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-gray-400">Pastors / Elders / Ministers</p>
              <p className="text-primary font-bold text-lg">₦3,000</p>
            </div>
          </div>
        </div>

        {/* Payer Email */}
        <div className="bg-card border border-white/10 rounded-xl p-5 mb-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">
              Your Email (Payer) <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={payerEmail}
              onChange={(e) => setPayerEmail(e.target.value)}
              className="form-input"
              placeholder="your.email@example.com"
            />
          </div>
        </div>

        {/* Registrant Cards */}
        <div className="space-y-4 mb-6">
          {registrants.map((registrant, index) => {
            const info = getRegInfo(registrant.title);
            const isCollapsed = collapsed[registrant.id];
            return (
              <div
                key={registrant.id}
                className="bg-card border border-white/10 rounded-xl overflow-hidden"
              >
                {/* Card Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleCollapse(registrant.id)}
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-semibold">
                      Person {index + 1}
                      {registrant.fullName && (
                        <span className="text-gray-400 font-normal ml-2">
                          — {registrant.title} {registrant.fullName}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {info && (
                      <span className="text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded-full">
                        ₦{info.amount.toLocaleString()}
                      </span>
                    )}
                    {registrants.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRegistrant(registrant.id);
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Card Body */}
                {!isCollapsed && (
                  <div className="px-5 pb-5 space-y-5 border-t border-white/5 pt-5">
                    {/* ── Personal Information ── */}
                    <div>
                      <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary font-bold">
                          1
                        </span>
                        Personal Information
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-300">
                            Title <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={registrant.title}
                            onChange={(e) =>
                              updateRegistrant(
                                registrant.id,
                                "title",
                                e.target.value,
                              )
                            }
                            className="form-input text-gray-600"
                          >
                            <option value="" className="text-gray-600">
                              Select title
                            </option>
                            {TITLES.map((t) => (
                              <option
                                key={t}
                                value={t}
                                className="text-gray-600"
                              >
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-300">
                            Full Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            value={registrant.fullName}
                            onChange={(e) =>
                              updateRegistrant(
                                registrant.id,
                                "fullName",
                                e.target.value,
                              )
                            }
                            className="form-input"
                            placeholder="Enter full name"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-300">
                            Email Address{" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="email"
                            value={registrant.email}
                            onChange={(e) =>
                              updateRegistrant(
                                registrant.id,
                                "email",
                                e.target.value,
                              )
                            }
                            className="form-input"
                            placeholder="your.email@example.com"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300">
                              Phone Number{" "}
                              <span className="text-red-400">*</span>
                            </label>
                            <input
                              value={registrant.phoneNumber}
                              onChange={(e) =>
                                updateRegistrant(
                                  registrant.id,
                                  "phoneNumber",
                                  e.target.value,
                                )
                              }
                              className="form-input"
                              placeholder="080 1234 5678"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300">
                              WhatsApp Number{" "}
                              <span className="text-red-400">*</span>
                            </label>
                            <input
                              value={registrant.whatsapp}
                              onChange={(e) =>
                                updateRegistrant(
                                  registrant.id,
                                  "whatsapp",
                                  e.target.value,
                                )
                              }
                              className="form-input"
                              placeholder="+234 800 000 0000"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">
                            Gender <span className="text-red-400">*</span>
                          </label>
                          <div className="flex gap-4">
                            <label className="radio-option">
                              <input
                                type="radio"
                                name={`gender-${registrant.id}`}
                                value="male"
                                checked={registrant.gender === "male"}
                                onChange={(e) =>
                                  updateRegistrant(
                                    registrant.id,
                                    "gender",
                                    e.target.value,
                                  )
                                }
                                className="accent-primary w-4 h-4"
                              />
                              <span>Male</span>
                            </label>
                            <label className="radio-option">
                              <input
                                type="radio"
                                name={`gender-${registrant.id}`}
                                value="female"
                                checked={registrant.gender === "female"}
                                onChange={(e) =>
                                  updateRegistrant(
                                    registrant.id,
                                    "gender",
                                    e.target.value,
                                  )
                                }
                                className="accent-primary w-4 h-4"
                              />
                              <span>Female</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Church & Location ── */}
                    <div>
                      <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary font-bold">
                          2
                        </span>
                        Church & Location
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">
                            Member of Living Faith Foundation?{" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <div className="flex gap-4">
                            <label className="radio-option">
                              <input
                                type="radio"
                                name={`lff-${registrant.id}`}
                                value="yes"
                                checked={registrant.isLFFMember === "yes"}
                                onChange={(e) =>
                                  updateRegistrant(
                                    registrant.id,
                                    "isLFFMember",
                                    e.target.value,
                                  )
                                }
                                className="accent-primary w-4 h-4"
                              />
                              <span>Yes</span>
                            </label>
                            <label className="radio-option">
                              <input
                                type="radio"
                                name={`lff-${registrant.id}`}
                                value="no"
                                checked={registrant.isLFFMember === "no"}
                                onChange={(e) =>
                                  updateRegistrant(
                                    registrant.id,
                                    "isLFFMember",
                                    e.target.value,
                                  )
                                }
                                className="accent-primary w-4 h-4"
                              />
                              <span>No</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-300">
                            {registrant.isLFFMember === "yes"
                              ? "State church name, District and State"
                              : "State your church name"}{" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <input
                            value={registrant.churchDetails}
                            onChange={(e) =>
                              updateRegistrant(
                                registrant.id,
                                "churchDetails",
                                e.target.value,
                              )
                            }
                            className="form-input"
                            placeholder={
                              registrant.isLFFMember === "yes"
                                ? "e.g. Central church Kaduna, Kaduna State"
                                : "e.g. Grace Assembly"
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300">
                              Area/District{" "}
                              <span className="text-red-400">*</span>
                            </label>
                            <input
                              value={registrant.areaDistrict}
                              onChange={(e) =>
                                updateRegistrant(
                                  registrant.id,
                                  "areaDistrict",
                                  e.target.value,
                                )
                              }
                              className="form-input"
                              placeholder="Your area or district"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300">
                              State <span className="text-red-400">*</span>
                            </label>
                            <input
                              value={registrant.state}
                              onChange={(e) =>
                                updateRegistrant(
                                  registrant.id,
                                  "state",
                                  e.target.value,
                                )
                              }
                              className="form-input"
                              placeholder="Your state"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-300">
                            Country <span className="text-red-400">*</span>
                          </label>
                          <input
                            value={registrant.country}
                            onChange={(e) =>
                              updateRegistrant(
                                registrant.id,
                                "country",
                                e.target.value,
                              )
                            }
                            className="form-input"
                            placeholder="Your country"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── Event Preferences ── */}
                    <div>
                      <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary font-bold">
                          3
                        </span>
                        Event Preferences
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">
                            Attendance Type{" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <div className="flex gap-4">
                            <label className="radio-option">
                              <input
                                type="radio"
                                name={`attendance-${registrant.id}`}
                                value="physical"
                                checked={
                                  registrant.attendanceType === "physical"
                                }
                                onChange={(e) =>
                                  updateRegistrant(
                                    registrant.id,
                                    "attendanceType",
                                    e.target.value,
                                  )
                                }
                                className="accent-primary w-4 h-4"
                              />
                              <span>Physical</span>
                            </label>
                            <label className="radio-option">
                              <input
                                type="radio"
                                name={`attendance-${registrant.id}`}
                                value="virtual"
                                checked={
                                  registrant.attendanceType === "virtual"
                                }
                                onChange={(e) =>
                                  updateRegistrant(
                                    registrant.id,
                                    "attendanceType",
                                    e.target.value,
                                  )
                                }
                                className="accent-primary w-4 h-4"
                              />
                              <span>Virtually</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">
                            Follow our buses from Area/District?{" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <div className="flex gap-4">
                            <label className="radio-option">
                              <input
                                type="radio"
                                name={`bus-${registrant.id}`}
                                value="yes"
                                checked={registrant.busInterest === "yes"}
                                onChange={(e) =>
                                  updateRegistrant(
                                    registrant.id,
                                    "busInterest",
                                    e.target.value,
                                  )
                                }
                                className="accent-primary w-4 h-4"
                              />
                              <span>Yes</span>
                            </label>
                            <label className="radio-option">
                              <input
                                type="radio"
                                name={`bus-${registrant.id}`}
                                value="no"
                                checked={registrant.busInterest === "no"}
                                onChange={(e) =>
                                  updateRegistrant(
                                    registrant.id,
                                    "busInterest",
                                    e.target.value,
                                  )
                                }
                                className="accent-primary w-4 h-4"
                              />
                              <span>No</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">
                            Meal Collection Point{" "}
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
                                  name={`meal-${registrant.id}`}
                                  value={option}
                                  checked={registrant.mealCollection === option}
                                  onChange={(e) =>
                                    updateRegistrant(
                                      registrant.id,
                                      "mealCollection",
                                      e.target.value,
                                    )
                                  }
                                  className="accent-primary w-4 h-4"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-300">
                            Prayer Request
                          </label>
                          <textarea
                            value={registrant.prayerRequest}
                            onChange={(e) =>
                              updateRegistrant(
                                registrant.id,
                                "prayerRequest",
                                e.target.value,
                              )
                            }
                            className="form-input min-h-[80px] resize-none"
                            placeholder="Share your prayer request..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add More */}
        <button
          onClick={addRegistrant}
          className="w-full border-2 border-dashed border-white/20 rounded-xl p-4 text-gray-400 hover:text-white hover:border-primary/50 transition-all flex items-center justify-center gap-2 mb-8"
        >
          <Plus className="w-5 h-5" />
          Add Another Person
        </button>

        {/* Summary & Pay */}
        <div className="bg-card border border-white/10 rounded-xl p-6 sticky bottom-4">
          {/* Breakdown */}
          {Object.keys(breakdown).length > 0 && (
            <div className="space-y-2 mb-4 text-sm">
              {Object.entries(breakdown).map(([label, info]) => (
                <div key={label} className="flex justify-between text-gray-300">
                  <span>
                    {info.count}x {label}
                  </span>
                  <span>₦{(info.count * info.amount).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 flex justify-between text-white font-bold text-lg">
                <span>Total ({registrants.length} people)</span>
                <span className="text-primary">
                  ₦{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={isSubmitting || !isValid || totalAmount === 0}
            className="w-full bg-[#09A5DB] hover:bg-[#088ebc] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#09A5DB]/20 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Pay ₦{totalAmount.toLocaleString()} with Paystack{" "}
                <CreditCard className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
