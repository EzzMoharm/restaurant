// components/shared/Navbar.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Menu as MenuIcon, X, LogOut, Shield, Sun, Moon, Globe } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useSettingsStore } from "@/store/settings";
import { useTranslation } from "@/lib/translations";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { isUserAdmin } from "@/lib/supabase/admin";
import { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";

export default function Navbar() {
    const router = useRouter();
    const { t, lang } = useTranslation();
    const { theme, toggleTheme, toggleLang } = useSettingsStore();
    const totalItems = useCartStore((state) => state.totalItems());
    const openCart = useCartStore((state) => state.openCart);

    const [isMounted, setIsMounted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auth States
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string>("");

    useEffect(() => {
        //eslint-disable-next-line
        setIsMounted(true);

        function loadCachedAvatar(userId: string) {
            try {
                const localMetaStr = localStorage.getItem(`biteflow-profile-meta-${userId}`);
                if (localMetaStr) {
                    const parsed = JSON.parse(localMetaStr);
                    if (parsed.avatarUrl) {
                        setAvatarUrl(parsed.avatarUrl);
                        return;
                    }
                }
            } catch (err) {
                console.error("Error loading cached avatar in navbar:", err);
            }
            setAvatarUrl("");
        }

        // Fetch initial session state
        async function fetchInitialSession() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setIsAdmin(isUserAdmin(user));
            useCartStore.getState().setUserId(user?.id || null);
            if (user) {
                loadCachedAvatar(user.id);
            } else {
                setAvatarUrl("");
            }
        }
        fetchInitialSession();

        // Subscribe to auth updates
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user || null;
            setUser(currentUser);
            setIsAdmin(isUserAdmin(currentUser));
            useCartStore.getState().setUserId(currentUser?.id || null);
            if (currentUser) {
                loadCachedAvatar(currentUser.id);
            } else {
                setAvatarUrl("");
            }
        });

        // Listen for profile-update event (for dynamic real-time local cache update)
        const handleProfileUpdate = () => {
            supabase.auth.getUser().then(({ data: { user: updatedUser } }) => {
                if (updatedUser) {
                    setUser(updatedUser);
                    loadCachedAvatar(updatedUser.id);
                }
            });
        };

        window.addEventListener("profile-update", handleProfileUpdate);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener("profile-update", handleProfileUpdate);
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
            router.push("/");
        }
    }

    return (
        <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm dark:bg-[#121216] dark:border-[#22222e] transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo / Brand */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
                            Bite<span className="text-orange-500">Flow</span>
                        </span>
                    </Link>

                    {/* Desktop Links (Hidden on mobile) */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium transition-colors">
                            {t.navMenu}
                        </Link>
                        {user && (
                            <Link href="/orders" className="text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium transition-colors">
                                {t.navMyOrders}
                            </Link>
                        )}
                        {isAdmin && (
                            <Link href="/admin" className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 font-medium transition-colors">
                                <Shield className="w-4 h-4 text-orange-500" />
                                {t.navAdmin}
                            </Link>
                        )}
                    </div>

                    {/* Actions (Cart, Theme, Lang & Mobile Toggle) */}
                    <div className="flex items-center gap-2 sm:gap-3">

                        {/* Language Switcher Button */}
                        <button 
                            onClick={toggleLang} 
                            className="flex items-center gap-1 p-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a24]"
                            title={lang === 'en' ? 'تغيير اللغة إلى العربية' : 'Switch to English'}
                        >
                            <Globe className="w-5 h-5 shrink-0" />
                            <span className="text-xs font-black uppercase tracking-wider">{lang === 'en' ? 'AR' : 'EN'}</span>
                        </button>

                        {/* Theme Toggle Button */}
                        <button 
                            onClick={toggleTheme} 
                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a24]"
                            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        {/* Cart Button */}
                        <button onClick={openCart} className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a24]">
                            <ShoppingCart className="w-5 h-5" />
                            {isMounted && totalItems > 0 && (
                                <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-orange-500 rounded-full animate-pulse">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        {/* Desktop Auth State / Logout */}
                        {isMounted && (
                            <div className="hidden md:flex items-center gap-3">
                                {user ? (
                                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#1a1a24] pl-3 pr-2 py-1.5 rounded-xl border border-gray-100 dark:border-[#22222e]">
                                        <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer" title="View Profile">
                                            <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
                                                {avatarUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img 
                                                        src={avatarUrl} 
                                                        alt="Profile Avatar"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    (user.user_metadata?.username || user.email || "U").charAt(0)
                                                )}
                                            </div>
                                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 max-w-[100px] truncate">
                                                {user.user_metadata?.username || user.email}
                                            </span>
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            title={t.navSignOut}
                                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer rounded-lg hover:bg-white dark:hover:bg-[#121216]"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors py-2 px-4 rounded-xl bg-orange-50 hover:bg-orange-100/80 border border-orange-200/50 dark:bg-orange-950/20 dark:border-orange-900/40"
                                    >
                                        {t.navSignIn}
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Mobile Menu Toggle Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-gray-600 dark:text-gray-300 cursor-pointer hover:text-orange-500 dark:hover:text-orange-400 transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a24]"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
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
                className={`md:hidden bg-white dark:bg-[#121216] border-t border-gray-100 dark:border-[#22222e] shadow-lg absolute w-full left-0 right-0 z-40 transition-all duration-300 ease-out origin-top ${
                    isMobileMenuOpen 
                        ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto" 
                        : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
                }`}
            >
                <div className="px-4 pt-2 pb-6 space-y-2">
                    <Link
                        href="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
                    >
                        {t.navMenu}
                    </Link>
                    {user && (
                        <Link
                            href="/orders"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
                        >
                            {t.navMyOrders}
                        </Link>
                    )}
                    {isAdmin && (
                        <Link
                            href="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-3 rounded-xl text-base font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
                        >
                            {t.navAdmin}
                        </Link>
                    )}
                    
                    {/* Mobile Auth Button */}
                    {isMounted && (
                        <div className="border-t border-gray-100 dark:border-[#22222e] pt-3 mt-2">
                            {user ? (
                                <div className="space-y-3 px-3">
                                    <Link 
                                        href="/profile"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer text-left"
                                        title="View Profile"
                                    >
                                        <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold uppercase overflow-hidden">
                                            {avatarUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img 
                                                    src={avatarUrl} 
                                                    alt="Profile Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                (user.user_metadata?.username || user.email || "U").charAt(0)
                                            )}
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">{t.navLoggedInAs}</span>
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">
                                                {user.user_metadata?.username || user.email}
                                            </span>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t.navSignOut}
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block px-3 py-3 rounded-xl text-base font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
                                >
                                    {t.navSignIn}
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}