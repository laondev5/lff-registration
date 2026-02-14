import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProductColor {
    name: string;
    hex: string;
}

export interface ProductVariant {
    color: string;
    size: string;
    stock: number;
    sku: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: string;
    category: string;
    images: string[];
    stock: string;
    createdAt?: string;
    variants?: ProductVariant[];
    colors?: ProductColor[];
    sizes?: string[];
}

export interface BulkItem {
    selectedColor: string;
    selectedSize: string;
    quantity: number;
}

export interface CartItem {
    product: Product;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
    bulkItems?: BulkItem[];
}

function getCartKey(item: CartItem): string {
    return `${item.product.id}_${item.selectedColor || ''}_${item.selectedSize || ''}`;
}

interface CartStore {
    items: CartItem[];
    addItem: (product: Product, selectedColor?: string, selectedSize?: string, quantity?: number) => void;
    addBulkItems: (product: Product, bulkItems: BulkItem[]) => void;
    removeItem: (productId: string, selectedColor?: string, selectedSize?: string) => void;
    updateQuantity: (productId: string, quantity: number, selectedColor?: string, selectedSize?: string) => void;
    clearCart: () => void;
    getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product, selectedColor, selectedSize, quantity = 1) => {
                const currentItems = get().items;
                const key = getCartKey({ product, quantity: 0, selectedColor, selectedSize });
                const existingIndex = currentItems.findIndex(item => getCartKey(item) === key);

                if (existingIndex >= 0) {
                    set({
                        items: currentItems.map((item, i) =>
                            i === existingIndex
                                ? { ...item, quantity: item.quantity + quantity }
                                : item
                        )
                    });
                } else {
                    set({
                        items: [...currentItems, { product, quantity, selectedColor, selectedSize }]
                    });
                }
            },
            addBulkItems: (product, bulkItems) => {
                const currentItems = get().items;
                const newItems = [...currentItems];

                for (const bulk of bulkItems) {
                    const key = getCartKey({
                        product,
                        quantity: 0,
                        selectedColor: bulk.selectedColor,
                        selectedSize: bulk.selectedSize,
                    });
                    const existingIndex = newItems.findIndex(item => getCartKey(item) === key);

                    if (existingIndex >= 0) {
                        newItems[existingIndex] = {
                            ...newItems[existingIndex],
                            quantity: newItems[existingIndex].quantity + bulk.quantity,
                        };
                    } else {
                        newItems.push({
                            product,
                            quantity: bulk.quantity,
                            selectedColor: bulk.selectedColor,
                            selectedSize: bulk.selectedSize,
                        });
                    }
                }

                set({ items: newItems });
            },
            removeItem: (productId, selectedColor, selectedSize) => {
                const key = getCartKey({
                    product: { id: productId } as Product,
                    quantity: 0,
                    selectedColor,
                    selectedSize,
                });
                set((state) => ({
                    items: state.items.filter(item => getCartKey(item) !== key)
                }));
            },
            updateQuantity: (productId, quantity, selectedColor, selectedSize) => {
                if (quantity <= 0) {
                    get().removeItem(productId, selectedColor, selectedSize);
                    return;
                }
                const key = getCartKey({
                    product: { id: productId } as Product,
                    quantity: 0,
                    selectedColor,
                    selectedSize,
                });
                set((state) => ({
                    items: state.items.map(item =>
                        getCartKey(item) === key
                            ? { ...item, quantity }
                            : item
                    )
                }));
            },
            clearCart: () => set({ items: [] }),
            getTotal: () => {
                return get().items.reduce((total, item) => {
                    return total + (parseFloat(item.product.price) * item.quantity);
                }, 0);
            }
        }),
        {
            name: 'cart-storage',
        }
    )
);
