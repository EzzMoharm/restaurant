// components/shared/Navbar.tsx
"use client";

import Link from "next/link";
import { ShoppingCart, Menu as MenuIcon } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useEffect, useState } from "react";

export default function Navbar() {
    const totalItems = useCartStore((state) => state.totalItems());
    const openCart = useCartStore((state) => state.openCart);

    // Hydration fix: Only render the cart count after the client has mounted
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo / Brand */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-extrabold tracking-tight text-gray-900">
                            Bite<span className="text-orange-500">Flow</span>
                        </span>
                    </Link>

                    {/* Desktop Links (Optional for later) */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
                            Menu
                        </Link>
                        <Link href="/admin" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
                            Admin
                        </Link>
                    </div>

                    {/* Cart Button */}
                    <div className="flex items-center gap-4">
                        <button onClick={openCart} className="relative p-2 text-gray-600 hover:text-orange-500 transition-colors cursor-pointer">
                            <ShoppingCart className="w-6 h-6 " />

                            {/* Live Cart Badge */}
                            {isMounted && totalItems > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-orange-500 rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        {/* Mobile Menu Icon */}
                        <button className="md:hidden p-2 text-gray-600">
                            <MenuIcon className="w-6 h-6" />
                        </button>
                    </div>

                </div>
            </div>
        </nav>
    );
}