import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: string;
    category: string;
    images: string[];
    stock: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartStore {
    items: CartItem[];
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) => {
                const currentItems = get().items;
                const existingItem = currentItems.find(item => item.product.id === product.id);

                if (existingItem) {
                    set({
                        items: currentItems.map(item =>
                            item.product.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        )
                    });
                } else {
                    set({ items: [...currentItems, { product, quantity: 1 }] });
                }
            },
            removeItem: (productId) => {
                set((state) => ({
                    items: state.items.filter(item => item.product.id !== productId)
                }));
            },
            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }
                set((state) => ({
                    items: state.items.map(item =>
                        item.product.id === productId
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
