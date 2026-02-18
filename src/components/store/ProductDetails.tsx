"use client";

import { useState, useMemo } from "react";
import {
  ShoppingCart,
  Check,
  ChevronLeft,
  Minus,
  Plus,
  X,
  Package,
} from "lucide-react";
import { useCartStore, Product, BulkItem } from "@/store/useCartStore";
import Link from "next/link";

export function ProductDetails({ product }: { product: Product }) {
  const { addItem, addBulkItems, getEffectivePrice } = useCartStore();
  const [mainImage, setMainImage] = useState(product.images[0] || null);
  const [added, setAdded] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  // Bulk order state
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);

  const hasVariants = product.variants && product.variants.length > 0;
  const hasColors = product.colors && product.colors.length > 0;
  const hasSizes = product.sizes && product.sizes.length > 0;

  const selectedVariant = useMemo(() => {
    if (!hasVariants || !selectedColor || !selectedSize) return null;
    return (
      product.variants?.find(
        (v) => v.color === selectedColor && v.size === selectedSize,
      ) || null
    );
  }, [hasVariants, selectedColor, selectedSize, product.variants]);

  const getVariantStock = (color: string, size: string) => {
    if (!product.variants) return 0;
    const v = product.variants.find(
      (v) => v.color === color && v.size === size,
    );
    return v ? v.stock : 0;
  };

  const isSizeAvailable = (size: string) => {
    if (!hasVariants) return true;
    if (!selectedColor) {
      return product.variants!.some((v) => v.size === size && v.stock > 0);
    }
    return getVariantStock(selectedColor, size) > 0;
  };

  const canAddToCart = () => {
    if (!hasVariants) return true;
    if (!selectedColor || !selectedSize) return false;
    return selectedVariant ? selectedVariant.stock > 0 : false;
  };

  const handleAddToCart = () => {
    if (!canAddToCart()) return;
    addItem(
      product,
      selectedColor || undefined,
      selectedSize || undefined,
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Bulk order functions
  const addBulkRow = () => {
    setBulkItems((prev) => [
      ...prev,
      { selectedColor: "", selectedSize: "", quantity: 1 },
    ]);
  };

  const updateBulkItem = (
    index: number,
    field: keyof BulkItem,
    value: string | number,
  ) => {
    setBulkItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const removeBulkItem = (index: number) => {
    setBulkItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalBulkQty = useMemo(() => {
    return bulkItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [bulkItems]);

  const effectiveUnitPrice = useMemo(() => {
    return getEffectivePrice(product, quantity);
  }, [product, quantity, getEffectivePrice]);

  const basePrice = parseInt(product.price);
  const discountPercent = useMemo(() => {
    if (effectiveUnitPrice >= basePrice) return 0;
    return (
      Math.round(((basePrice - effectiveUnitPrice) / basePrice) * 100 * 100) /
      100
    );
  }, [effectiveUnitPrice, basePrice]);

  const bulkEffectivePrice = useMemo(() => {
    return getEffectivePrice(product, totalBulkQty);
  }, [product, totalBulkQty, getEffectivePrice]);

  const bulkTotal = useMemo(() => {
    return totalBulkQty * bulkEffectivePrice;
  }, [totalBulkQty, bulkEffectivePrice]);

  const bulkDiscountPercent = useMemo(() => {
    if (bulkEffectivePrice >= basePrice) return 0;
    return (
      Math.round(((basePrice - bulkEffectivePrice) / basePrice) * 100 * 100) /
      100
    );
  }, [bulkEffectivePrice, basePrice]);

  const handleBulkAddToCart = () => {
    const validItems = bulkItems.filter(
      (item) => item.selectedColor && item.selectedSize && item.quantity > 0,
    );
    if (validItems.length === 0) return;
    addBulkItems(product, validItems);
    setAdded(true);
    setBulkItems([]);
    setBulkMode(false);
    setTimeout(() => setAdded(false), 2000);
  };

  const currentStock = hasVariants
    ? selectedVariant
      ? selectedVariant.stock
      : null
    : parseInt(product.stock) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="aspect-square bg-card border border-white/10 rounded-2xl overflow-hidden image-zoom-container">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No Image Available
            </div>
          )}
        </div>

        {product.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setMainImage(img)}
                className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  mainImage === img
                    ? "border-primary shadow-lg shadow-primary/20"
                    : "border-transparent hover:border-white/20"
                }`}
              >
                <img
                  src={img}
                  alt={`View ${idx}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col">
        <Link
          href="/store"
          className="text-sm text-gray-500 hover:text-white mb-6 inline-flex items-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Store
        </Link>

        <div className="text-primary font-bold uppercase tracking-wider text-sm mb-2">
          {product.category}
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
        <div className="text-3xl font-bold text-white mb-2">
          ₦{basePrice.toLocaleString()}
        </div>

        {/* Pricing Tiers Display */}
        {product.pricingTiers && product.pricingTiers.length > 0 && (
          <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Bulk Pricing
            </p>
            <div className="space-y-2">
              {product.pricingTiers.map((tier, idx) => {
                const tierDiscount =
                  Math.round(
                    ((basePrice - tier.pricePerUnit) / basePrice) * 100 * 100,
                  ) / 100;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-300">
                      {tier.maxQty
                        ? `${tier.minQty}–${tier.maxQty} pcs`
                        : `${tier.minQty}+ pcs`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">
                        ₦{tier.pricePerUnit.toLocaleString()}
                      </span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                        {tierDiscount}% off
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Target Audience Badge */}
        {product.targetAudience && (
          <div className="mb-4">
            <span
              className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                product.targetAudience === "kids"
                  ? "bg-pink-500/20 text-pink-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {product.targetAudience === "kids" ? "👶 Kids" : "👤 Adult"}
            </span>
          </div>
        )}

        {/* Stock status */}
        {currentStock !== null && (
          <div className="mb-6">
            {currentStock === 0 ? (
              <span className="text-red-400 text-sm font-medium">
                Out of Stock
              </span>
            ) : currentStock <= 5 ? (
              <span className="text-orange-400 text-sm font-medium">
                Only {currentStock} left in stock
              </span>
            ) : (
              <span className="text-green-400 text-sm font-medium">
                In Stock ({currentStock} available)
              </span>
            )}
          </div>
        )}

        <div className="prose prose-invert max-w-none mb-8 text-gray-400">
          <p>{product.description}</p>
        </div>

        {/* Color Selection */}
        {hasColors && (
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-300 mb-3 block">
              Color
              {selectedColor && (
                <span className="text-primary ml-2">{selectedColor}</span>
              )}
            </label>
            <div className="flex flex-wrap gap-3">
              {product.colors!.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(color.name)}
                  className={`color-swatch ${selectedColor === color.name ? "active" : ""}`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size Selection */}
        {hasSizes && (
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-300 mb-3 block">
              Size
            </label>
            <div className="flex flex-wrap gap-2">
              {product.sizes!.map((size) => {
                const available = isSizeAvailable(size);
                return (
                  <button
                    key={size}
                    onClick={() => available && setSelectedSize(size)}
                    className={`size-pill ${selectedSize === size ? "active" : ""} ${!available ? "disabled" : ""}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Variant stock after selection */}
        {hasVariants && selectedColor && selectedSize && (
          <div className="mb-6 text-sm animate-slide-up">
            {selectedVariant && selectedVariant.stock > 0 ? (
              <span className="text-green-400">
                {selectedVariant.stock} available for {selectedColor} /{" "}
                {selectedSize}
              </span>
            ) : (
              <span className="text-red-400">
                This combination is out of stock
              </span>
            )}
          </div>
        )}

        {/* Quantity Selector */}
        <div className="mb-8">
          <label className="text-sm font-medium text-gray-300 mb-3 block">
            Quantity
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-16 h-10 text-center bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          {/* Discount applied indicator */}
          {discountPercent > 0 && (
            <div className="mt-3 flex items-center gap-2 animate-slide-up">
              <span className="inline-flex items-center gap-1.5 text-sm bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg font-medium">
                🎉 {discountPercent}% discount applied
              </span>
              <span className="text-sm text-gray-400">
                ₦{effectiveUnitPrice.toLocaleString()}/pc
              </span>
            </div>
          )}
        </div>

        {/* Add to Cart */}
        <div className="space-y-4">
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart()}
            className={`w-full btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              added ? "bg-green-600 hover:bg-green-700" : ""
            }`}
          >
            {added ? (
              <>
                <Check className="w-5 h-5" /> Added to Cart
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" /> Add to Cart
              </>
            )}
          </button>

          {hasVariants && !selectedColor && !selectedSize && (
            <p className="text-xs text-gray-500 text-center">
              Select a color and size to add to cart
            </p>
          )}

          {added && (
            <div className="text-center">
              <Link
                href="/store/cart"
                className="text-sm text-primary hover:underline"
              >
                View Cart & Checkout
              </Link>
            </div>
          )}
        </div>

        {/* Bulk Order Section - Redesigned */}
        {hasVariants && (
          <div className="mt-10 p-1 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent w-full">
            <div className="bg-[#0f0f0f] border border-primary/30 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Package size={120} />
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                      <Package className="text-primary" />
                      Bulk & Wholesale Order
                    </h3>
                    <p className="text-gray-400 text-sm max-w-md">
                      Mix and match different colors and sizes! The discount
                      applies to the{" "}
                      <span className="text-primary font-bold">
                        total quantity
                      </span>{" "}
                      of all variants combined.
                    </p>
                  </div>
                  {!bulkMode && (
                    <button
                      onClick={() => {
                        setBulkMode(true);
                        if (bulkItems.length === 0) {
                          setBulkItems([
                            {
                              selectedColor: "",
                              selectedSize: "",
                              quantity: 1,
                            },
                          ]);
                        }
                      }}
                      className="btn-primary px-6 py-2.5 text-sm font-bold shadow-lg shadow-primary/20 animate-pulse"
                    >
                      Start Bulk Order
                    </button>
                  )}
                </div>

                {bulkMode && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                      {bulkItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-14 gap-3 items-center"
                        >
                          <div className="col-span-12 md:col-span-5">
                            <select
                              value={item.selectedColor}
                              onChange={(e) =>
                                updateBulkItem(
                                  idx,
                                  "selectedColor",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                            >
                              <option value="" className="text-gray-500">
                                Select Color...
                              </option>
                              {product.colors?.map((c) => (
                                <option
                                  key={c.name}
                                  value={c.name}
                                  className="text-black"
                                >
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-12 md:col-span-4">
                            <select
                              value={item.selectedSize}
                              onChange={(e) =>
                                updateBulkItem(
                                  idx,
                                  "selectedSize",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                            >
                              <option value="" className="text-gray-500">
                                Select Size...
                              </option>
                              {product.sizes?.map((s) => (
                                <option
                                  key={s}
                                  value={s}
                                  className="text-black"
                                >
                                  {s} (Size)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-9 md:col-span-2 flex items-center gap-1">
                            <button
                              onClick={() =>
                                updateBulkItem(
                                  idx,
                                  "quantity",
                                  Math.max(1, item.quantity - 1),
                                )
                              }
                              className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateBulkItem(
                                  idx,
                                  "quantity",
                                  Math.max(1, parseInt(e.target.value) || 1),
                                )
                              }
                              className="w-16 h-10 text-center bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                            />
                            <button
                              onClick={() =>
                                updateBulkItem(
                                  idx,
                                  "quantity",
                                  item.quantity + 1,
                                )
                              }
                              className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <div className="col-span-3 md:col-span-3 flex justify-end">
                            <button
                              onClick={() => removeBulkItem(idx)}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-2">
                      <button
                        onClick={addBulkRow}
                        className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-2 px-2 py-1"
                      >
                        <Plus size={16} /> Add Another Variant
                      </button>

                      <div className="flex items-center gap-6 bg-white/5 px-6 py-3 rounded-xl border border-white/10 ml-auto w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <div className="text-xs text-gray-400">
                            Total Items
                          </div>
                          <div className="font-bold text-white text-lg">
                            {totalBulkQty} pcs
                          </div>
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-2"></div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">
                            Total Price
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary text-xl">
                              ₦{bulkTotal.toLocaleString()}
                            </span>
                            {bulkDiscountPercent > 0 && (
                              <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                -{bulkDiscountPercent}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleBulkAddToCart}
                      disabled={
                        bulkItems.filter(
                          (i) =>
                            i.selectedColor && i.selectedSize && i.quantity > 0,
                        ).length === 0
                      }
                      className="w-full btn-primary py-3.5 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      Add Bulk Order to Cart
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
