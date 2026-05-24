// components/shared/Navbar.tsx
"use client";

import Link from "next/link";
import { ShoppingCart, Menu as MenuIcon, X, LogOut, Shield } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { isUserAdmin } from "@/lib/supabase/admin";
import { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";

export default function Navbar() {
    const totalItems = useCartStore((state) => state.totalItems());
    const openCart = useCartStore((state) => state.openCart);

    const [isMounted, setIsMounted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auth States
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        //eslint-disable-next-line
        setIsMounted(true);

        // Fetch initial session state
        async function fetchInitialSession() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setIsAdmin(isUserAdmin(user));
            useCartStore.getState().setUserId(user?.id || null);
        }
        fetchInitialSession();

        // Subscribe to auth updates
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user || null;
            setUser(currentUser);
            setIsAdmin(isUserAdmin(currentUser));
            useCartStore.getState().setUserId(currentUser?.id || null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function handleSignOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("Error signing out: " + error.message);
        } else {
            toast.success("Signed out successfully.", {
                style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
            });
            setIsMobileMenuOpen(false);
        }
    }

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
                        {user && (
                            <Link href="/orders" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
                                My Orders
                            </Link>
                        )}
                        {isAdmin && (
                            <Link href="/admin" className="inline-flex items-center gap-1.5 text-gray-600 hover:text-orange-500 font-medium transition-colors">
                                <Shield className="w-4 h-4 text-orange-500" />
                                Admin Dashboard
                            </Link>
                        )}
                    </div>

                    {/* Actions (Cart & Mobile Toggle) */}
                    <div className="flex items-center gap-2 sm:gap-4">

                        {/* Cart Button */}
                        <button onClick={openCart} className="relative p-2 text-gray-600 hover:text-orange-500 transition-colors cursor-pointer">
                            <ShoppingCart className="w-6 h-6" />
                            {isMounted && totalItems > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-orange-500 rounded-full animate-pulse">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        {/* Desktop Auth State / Logout */}
                        {isMounted && (
                            <div className="hidden md:flex items-center gap-3">
                                {user ? (
                                    <div className="flex items-center gap-3 bg-gray-50 pl-3 pr-2 py-1.5 rounded-xl border border-gray-100">
                                        <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer" title="View Profile">
                                            <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold uppercase">
                                                {(user.user_metadata?.username || user.email || "U").charAt(0)}
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 max-w-[120px] truncate">
                                                {user.user_metadata?.username || user.email}
                                            </span>
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            title="Sign Out"
                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-white"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors py-2 px-4 rounded-xl bg-orange-50 hover:bg-orange-100/80 border border-orange-200/50"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Mobile Menu Toggle Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-gray-600 cursor-pointer hover:text-orange-500 transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                        </button>
                    </div>

                </div>
            </div>

            {/* Backdrop for click-outside */}
            <div
                onClick={() => setIsMobileMenuOpen(false)}
                className={`fixed inset-0 top-16 bg-black/40 backdrop-blur-xs z-30 transition-opacity duration-300 md:hidden ${
                    isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
            />

            {/* Mobile Menu Dropdown UI */}
            <div
                className={`md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full left-0 right-0 z-40 transition-all duration-300 ease-out origin-top ${
                    isMobileMenuOpen 
                        ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto" 
                        : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
                }`}
            >
                <div className="px-4 pt-2 pb-6 space-y-2">
                    <Link
                        href="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                    >
                        Menu
                    </Link>
                    {user && (
                        <Link
                            href="/orders"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                        >
                            My Orders
                        </Link>
                    )}
                    {isAdmin && (
                        <Link
                            href="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-3 rounded-xl text-base font-medium text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                            Admin Dashboard
                        </Link>
                    )}
                    
                    {/* Mobile Auth Button */}
                    {isMounted && (
                        <div className="border-t border-gray-100 pt-3 mt-2">
                            {user ? (
                                <div className="space-y-3 px-3">
                                    <Link 
                                        href="/profile"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer text-left"
                                        title="View Profile"
                                    >
                                        <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold uppercase">
                                            {(user.user_metadata?.username || user.email || "U").charAt(0)}
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className="text-xs font-semibold text-gray-400">Logged in as</span>
                                            <span className="text-sm font-bold text-gray-700 truncate">
                                                {user.user_metadata?.username || user.email}
                                            </span>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block px-3 py-3 rounded-xl text-base font-bold text-orange-600 hover:bg-orange-50 transition-colors"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}