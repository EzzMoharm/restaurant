// app/order-success/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, ArrowRight, Sparkles } from "lucide-react";

export default function OrderSuccessPage() {
    const [orderNumber, setOrderNumber] = useState("");

    useEffect(() => {
        // Generate a random mock order reference number on mount
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        //eslint-disable-next-line
        setOrderNumber(`BF-${randomNum}`);
    }, []);

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 via-white to-gray-50 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            <div className="max-w-md w-full relative z-10 text-center bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
                {/* Checkmark Celebration */}
                <div className="relative inline-flex mb-2">
                    <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-60 scale-150 animate-pulse"></div>
                    <div className="inline-flex p-5 bg-green-100 text-green-600 rounded-full scale-110 relative z-10">
                        <CheckCircle2 className="w-14 h-14" />
                    </div>
                    {/* Tiny sparkles icon */}
                    <div className="absolute -top-1 -right-1 text-orange-500 animate-bounce">
                        <Sparkles className="w-5 h-5" />
                    </div>
                </div>

                {/* Celebration Messages */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Order Placed!</h1>
                    <p className="text-sm font-semibold text-green-600 uppercase tracking-widest flex items-center justify-center gap-1">
                        {"We're on it!"}
                    </p>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                        {"Thank you for ordering from BiteFlow. Your payment was simulated successfully and our chefs' preparation has started!"}
                    </p>
                </div>

                {/* Order Meta details */}
                <div className="bg-gray-50/60 border border-gray-100/50 p-4 rounded-2xl text-left space-y-3.5">
                    {/* Order Reference */}
                    <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2.5">
                        <span className="text-gray-400 font-semibold">Order Reference</span>
                        <span className="font-extrabold text-gray-800 tracking-wide">{orderNumber}</span>
                    </div>

                    {/* Estimated Time */}
                    <div className="flex items-start gap-3 text-sm">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-xl mt-0.5">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">Estimated Delivery</h4>
                            <p className="text-xs text-gray-500">25 - 35 Minutes</p>
                        </div>
                    </div>

                    {/* Delivery Status */}
                    <div className="flex items-start gap-3 text-sm">
                        <div className="p-2 bg-green-100 text-green-600 rounded-xl mt-0.5">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">Delivery Status</h4>
                            <p className="text-xs text-gray-500">Food is being prepared in the kitchen</p>
                        </div>
                    </div>
                </div>

                {/* Back to home trigger */}
                <Link
                    href="/"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                    Back to Menu
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
