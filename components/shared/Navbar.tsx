// components/shared/Navbar.tsx
"use client";

import Link from "next/link";
// 1. Added the X icon for closing the menu
import { ShoppingCart, Menu as MenuIcon, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useEffect, useState } from "react";

export default function Navbar() {
    const totalItems = useCartStore((state) => state.totalItems());
    const openCart = useCartStore((state) => state.openCart);

    const [isMounted, setIsMounted] = useState(false);

    // 2. State to track if the mobile menu is open
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        //eslint-disable-next-line
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

                    {/* Desktop Links (Hidden on mobile) */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
                            Menu
                        </Link>
                        <Link href="/admin" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
                            Admin
                        </Link>
                    </div>

                    {/* Actions (Cart & Mobile Toggle) */}
                    <div className="flex items-center gap-2 sm:gap-4">

                        {/* Cart Button */}
                        <button onClick={openCart} className="relative p-2 text-gray-600 hover:text-orange-500 transition-colors cursor-pointer">
                            <ShoppingCart className="w-6 h-6" />
                            {isMounted && totalItems > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-orange-500 rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        {/* 3. Mobile Menu Toggle Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-gray-600 cursor-pointer hover:text-orange-500 transition-colors"
                        >
                            {/* Swap between Hamburger and X icon depending on state */}
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                        </button>
                    </div>

                </div>
            </div>

            {/* 4. Mobile Menu Dropdown UI */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        <Link
                            href="/"
                            onClick={() => setIsMobileMenuOpen(false)} // Close menu when clicked
                            className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                        >
                            Menu
                        </Link>
                        <Link
                            href="/admin"
                            onClick={() => setIsMobileMenuOpen(false)} // Close menu when clicked
                            className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                        >
                            Admin Dashboard
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}