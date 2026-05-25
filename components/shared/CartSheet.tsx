/* eslint-disable react-hooks/set-state-in-effect */
// components/shared/CartSheet.tsx
"use client";

import { useCartStore, CartItem } from "@/store/cart";
import { X, Trash2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import Link from "next/link";

export default function CartSheet() {
    const router = useRouter();
    const { items, isOpen, closeCart, removeItem, cartTotal, setEditingItem } = useCartStore();
    const [isMounted, setIsMounted] = useState(false);

    // Hydration fix
    useEffect(() => {
        setIsMounted(true);
    }, []);

    function handleEditCartItem(item: CartItem) {
        setEditingItem(item);
        closeCart();
    }

    async function handleCheckout() {
        try {
            // 1. Check user login session
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                toast.error("Please sign in to place your order!", {
                    style: { border: '1px solid #F59E0B', padding: '16px', color: '#B45309', fontWeight: 'bold' }
                });
                closeCart();
                router.push("/login");
                return;
            }

            // 2. Redirect to Checkout portal
            closeCart();
            router.push("/checkout");
        } catch (error) {
            console.error("Error navigating to checkout:", error);
        }
    }

    if (!isMounted) return null;

    return (
        <>
            {/* Dark Overlay - Clicking it closes the cart */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={closeCart}
                />
            )}

            {/* Sliding Sheet */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-100 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Cart Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                    <button onClick={closeCart} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cart Items (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">
                            <p>Your cart is empty.</p>
                            <Link 
                                href="/" 
                                onClick={closeCart} 
                                className="mt-4 inline-block text-orange-500 font-bold hover:underline cursor-pointer"
                            >
                                Browse Menu
                            </Link>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                    {item.customization && (
                                        <div className="text-[10px] text-gray-400 font-semibold mt-0.5 space-y-0.5 text-left pl-1.5 border-l border-orange-500/30">
                                            {item.customization.size && (
                                                <p className="leading-tight">
                                                    Portion: <span className="text-gray-600 font-bold">{item.customization.size}</span>
                                                </p>
                                            )}
                                            {(item.customization.addons && item.customization.addons.length > 0) && (
                                                <p className="leading-tight">
                                                    Toppings: <span className="text-orange-500">{item.customization.addons.join(", ")}</span>
                                                </p>
                                            )}
                                            {item.customization.instructions && (
                                                <p className="italic text-gray-400 font-normal leading-tight">
                                                    Note: &quot;{item.customization.instructions}&quot;
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        ${item.price.toFixed(2)} x {item.quantity}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-gray-900">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                    <button
                                        onClick={() => handleEditCartItem(item)}
                                        className="text-orange-400 hover:text-orange-600 transition-colors cursor-pointer"
                                        title="Edit Customization"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                        title="Remove Item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Footer / Checkout */}
                {items.length > 0 && (
                    <div className="p-6 border-t bg-gray-50">
                        <div className="flex justify-between items-center mb-4 text-lg font-bold text-gray-900">
                            <span>Total</span>
                            <span>${cartTotal().toFixed(2)}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}