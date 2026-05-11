/* eslint-disable react-hooks/set-state-in-effect */
// components/shared/CartSheet.tsx
"use client";

import { useCartStore } from "@/store/cart";
import { X, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function CartSheet() {
    const { items, isOpen, closeCart, removeItem, cartTotal } = useCartStore();
    const [isMounted, setIsMounted] = useState(false);

    // Hydration fix
    useEffect(() => {
        setIsMounted(true);
    }, []);

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
                            <button onClick={closeCart} className="mt-4 text-orange-500 font-medium hover:underline">
                                Browse Menu
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        ${item.price.toFixed(2)} x {item.quantity}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-gray-900">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-red-400 hover:text-red-600 transition-colors"
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
                        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-colors shadow-sm">
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}