"use client";

import { useCartStore } from "@/store/useCartStore";
import Link from "next/link";
import { Trash2, ChevronRight, ShoppingBag, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getEffectivePrice } =
    useCartStore();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Your Cart is Empty
        </h1>
        <p className="text-gray-400 mb-8">
          Looks like you haven't added anything yet.
        </p>
        <Link href="/store" className="btn-primary">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, idx) => {
              // Calculate total quantity of this product (across all variants) in the cart
              const totalProductQty = items
                .filter((i) => i.product.id === item.product.id)
                .reduce((sum, i) => sum + i.quantity, 0);

              const effectivePrice = getEffectivePrice(
                item.product,
                totalProductQty,
              );
              const basePrice = parseInt(item.product.price);
              const isDiscounted = effectivePrice < basePrice;
              const discountPct = isDiscounted
                ? Math.round(
                    ((basePrice - effectivePrice) / basePrice) * 100 * 100,
                  ) / 100
                : 0;

              return (
                <div
                  key={`${item.product.id}_${item.selectedColor}_${item.selectedSize}_${idx}`}
                  className="bg-card border border-white/10 rounded-xl p-4 flex gap-4 items-center"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">
                      {item.product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-semibold">
                        ₦{effectivePrice.toLocaleString()}
                      </span>
                      {isDiscounted && (
                        <>
                          <span className="text-gray-500 text-sm line-through">
                            ₦{basePrice.toLocaleString()}
                          </span>
                          <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                            {discountPct}% off
                          </span>
                        </>
                      )}
                    </div>
                    {/* Variant info */}
                    {(item.selectedColor || item.selectedSize) && (
                      <div className="flex items-center gap-2 mt-1">
                        {item.selectedColor && (
                          <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded">
                            {item.selectedColor}
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded">
                            {item.selectedSize}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            Math.max(1, item.quantity - 1),
                            item.selectedColor,
                            item.selectedSize,
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.product.id,
                            Math.max(1, parseInt(e.target.value) || 1),
                            item.selectedColor,
                            item.selectedSize,
                          )
                        }
                        className="w-14 h-8 text-center bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity + 1,
                            item.selectedColor,
                            item.selectedSize,
                          )
                        }
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        removeItem(
                          item.product.id,
                          item.selectedColor,
                          item.selectedSize,
                        )
                      }
                      className="text-gray-500 hover:text-red-500 transition-colors p-2"
                      title="Remove"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-white/10 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>
                    Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
                  </span>
                  <span>₦{getTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="text-xs">(Calculated at next step)</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-xl">
                  <span>Total</span>
                  <span>₦{getTotal().toLocaleString()}</span>
                </div>
              </div>

              <Link
                href="/store/checkout"
                className="w-full btn-primary py-3 flex items-center justify-center font-bold"
              >
                Checkout <ChevronRight className="w-4 h-4 ml-2" />
              </Link>

              <div className="mt-4 text-center">
                <Link
                  href="/store"
                  className="text-sm text-gray-500 hover:text-white"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
