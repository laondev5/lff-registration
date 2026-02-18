"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRegistrationStore } from "@/store/useRegistrationStore";
import { useCartStore } from "@/store/useCartStore";
import {
  Loader2,
  CheckCircle,
  User,
  Mail,
  Phone,
  Upload,
  CreditCard,
  Building2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const guestSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number is required"),
});

type GuestFormData = z.infer<typeof guestSchema>;

interface PaymentAccount {
  accountName: string;
  accountNumber: string;
  bankName: string;
  type: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data } = useRegistrationStore();
  const { items, getTotal, clearCart, getEffectivePrice } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: Payment Info, 3: Upload Proof
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  /* Removed PaymentAccount/Manual State */
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<GuestFormData | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
  });

  useEffect(() => {
    setMounted(true);
    if (data.uniqueId) {
      setValue("fullName", data.fullName || "");
      setValue("email", data.email || "");
      setValue("phone", data.phoneNumber || "");
    }
  }, [data, setValue]);

  /* Removed Payment Account Fetching Effect */

  if (!mounted) return null;

  if (items.length === 0 && !orderSuccess) {
    router.push("/store");
    return null;
  }

  const onDetailsSubmit = (formData: GuestFormData) => {
    setCustomerInfo(formData);
    setStep(2);
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

  const handlePlaceOrder = async () => {
    if (!customerInfo) return;
    setIsSubmitting(true);

    try {
      // If there's a proof file, upload via FormData
      let paymentProofUrl = "";
      if (proofFile) {
        setUploadingProof(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", proofFile);
        const uploadRes = await fetch("/api/upload-payment-proof", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) {
          paymentProofUrl = uploadResult.url;
        }
        setUploadingProof(false);
      }

      const orderData = {
        userId: data.uniqueId || null,
        items,
        total: getTotal().toString(),
        customerName: customerInfo.fullName,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        paymentProof: paymentProofUrl,
      };

      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await res.json();
      if (result.success) {
        setOrderId(result.id);
        setOrderSuccess(true);
        clearCart();
        router.push(`/store/order-success?orderId=${result.id}&pickup=true`);
      } else {
        alert("Order failed: " + result.error);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred placing your order.");
    } finally {
      setIsSubmitting(false);
      setUploadingProof(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-white/10 rounded-2xl p-8 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Order Placed!</h2>
          <p className="text-gray-400 mb-2">
            Your order <strong>#{orderId}</strong> has been successfully placed.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            {proofFile
              ? "Your payment proof has been uploaded. We'll verify and process your order shortly."
              : "Please ensure payment is completed. We'll contact you for confirmation."}
          </p>
          <Link href="/store" className="btn-primary inline-flex items-center">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-10 gap-2">
          {[
            { num: 1, label: "Details" },
            { num: 2, label: "Confirm & Pay" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s.num ? "bg-primary text-black" : "bg-white/10 text-gray-500"}`}
              >
                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
              </div>
              <span
                className={`text-sm font-medium hidden sm:inline ${step >= s.num ? "text-white" : "text-gray-500"}`}
              >
                {s.label}
              </span>
              {i < 2 && (
                <div
                  className={`w-12 h-0.5 ${step > s.num ? "bg-primary" : "bg-white/10"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Summary - always visible */}
          <div className="bg-card border border-white/10 rounded-2xl p-6 h-fit">
            <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, idx) => {
                const effectivePrice = getEffectivePrice(
                  item.product,
                  item.quantity,
                );
                const basePrice = parseInt(item.product.price);
                const isDiscounted = effectivePrice < basePrice;
                return (
                  <div
                    key={`${item.product.id}_${item.selectedColor}_${item.selectedSize}_${idx}`}
                    className="flex gap-4 items-center bg-white/5 p-3 rounded-lg"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {item.product.images[0] && (
                        <img
                          src={item.product.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Qty: {item.quantity}
                      </p>
                      {isDiscounted && (
                        <span className="inline-block mt-1 text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                          ₦{(basePrice - effectivePrice).toLocaleString()}{" "}
                          off/pc
                        </span>
                      )}
                      {(item.selectedColor || item.selectedSize) && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {item.selectedColor && (
                            <span className="text-xs bg-white/10 text-gray-300 px-1.5 py-0.5 rounded">
                              {item.selectedColor}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="text-xs bg-white/10 text-gray-300 px-1.5 py-0.5 rounded">
                              {item.selectedSize}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {isDiscounted && (
                        <p className="text-xs text-gray-500 line-through">
                          ₦{(basePrice * item.quantity).toLocaleString()}
                        </p>
                      )}
                      <p className="text-sm font-bold text-primary">
                        ₦{(effectivePrice * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-white/10 pt-4 flex justify-between text-white font-bold text-xl">
              <span>Total</span>
              <span>₦{getTotal().toLocaleString()}</span>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-card border border-white/10 rounded-2xl p-8 h-fit">
            {/* Step 1: Customer Details */}
            {step === 1 && (
              <>
                <h1 className="text-2xl font-bold text-white mb-6">
                  Customer Details
                </h1>
                <form
                  onSubmit={handleSubmit(onDetailsSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        {...register("fullName")}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-red-500 text-xs">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        {...register("email")}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        {...register("phone")}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                        placeholder="08012345678"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full btn-primary py-3 text-lg font-bold flex items-center justify-center gap-2"
                    >
                      Continue to Payment <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 2: Pay with Paystack directly */}
            {step === 2 && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6" /> Confirm Order
                </h1>

                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                  <p className="text-gray-300 mb-4">
                    You are about to pay{" "}
                    <strong>₦{getTotal().toLocaleString()}</strong> via
                    Paystack.
                  </p>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" /> Back
                    </button>

                    <button
                      onClick={async () => {
                        if (!customerInfo) return;
                        setIsSubmitting(true);
                        try {
                          // 1. Initialize Paystack Transaction
                          const payRes = await fetch(
                            "/api/paystack/initialize",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                email: customerInfo.email,
                                amount: getTotal(),
                                type: "store",
                                metadata: {
                                  customerName: customerInfo.fullName,
                                  customerEmail: customerInfo.email,
                                  customerPhone: customerInfo.phone,
                                  items: items.map((i) => ({
                                    name: i.product.name,
                                    qty: i.quantity,
                                  })),
                                },
                              }),
                            },
                          );

                          const payData = await payRes.json();
                          if (!payData.success) throw new Error(payData.error);

                          // 2. Create the order in "Pending" status
                          const orderData = {
                            userId: data.uniqueId || null,
                            items,
                            total: getTotal().toString(),
                            customerName: customerInfo.fullName,
                            customerEmail: customerInfo.email,
                            customerPhone: customerInfo.phone,
                            paymentProof: "Paystack Pending",
                          };

                          await fetch("/api/store/orders", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(orderData),
                          });

                          // 3. Redirect
                          window.location.href = payData.data.authorization_url;
                        } catch (err: any) {
                          alert("Payment error: " + err.message);
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting}
                      className="flex-1 btn-primary py-3 font-bold flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Pay Now <CreditCard className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Upload Proof & Confirm */}
            {/* Step 3: Removed Upload Proof Step */}
          </div>
        </div>
      </div>
    </div>
  );
}
