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
import { useTranslation, translateMenu } from "@/lib/translations";
import { useSettingsStore } from "@/store/settings";

const translateAddon = (addon: string, lang: string) => {
    if (addon && lang === 'ar') {
        const map: Record<string, string> = {
            "Extra Cheese": "جبنة إضافية",
            "Gluten-Free Base": "عجينة خالية من الغلوتين",
            "Spicy Jalapeno": "هالبينو حار",
            "Truffle Oil Drizzle": "زيت الترفل",
            "Extra Patty": "شريحة لحم إضافية",
            "Avocado Slices": "شرائح أفوكادو",
            "Vanilla Ice Cream Scoop": "كرة آيس كريم فانيليا",
            "Mint Sprig": "غصن نعناع",
            "Whipped Cream": "كريمة مخفوقة",
            "Chocolate Sauce": "صلصة الشوكولاتة",
            "No Sugar": "بدون سكر",
            "Less Ice": "ثلج قليل",
            "Extra Shot": "جرعة إضافية",
            "Regular": "عادي",
            "Medium": "متوسط",
            "Large": "كبير",
            "Small": "صغير",
            "Double Portion": "حصة مضاعفة",
            "Extra Ice": "ثلج إضافي",
            "Lemon Slice": "شريحة ليمون",
            "Mint Leaves": "أوراق نعناع",
            "Whipped Cream ": "كريمة مخفوقة ",
            "Chocolate Syrup": "شراب شوكولاتة",
            "Scoop of Vanilla Ice Cream": "كرة آيس كريم فانيليا",
            "Bacon Strips": "شرائح قديد لحم البقر",
            "Jalapeños": "هالبينو",
            "Sautéed Mushrooms": "فطر سوتيه"
        };
        return map[addon] || addon;
    }
    return addon;
};

export default function CartSheet() {
    const router = useRouter();
    const { t, lang } = useTranslation();
    const theme = useSettingsStore((state) => state.theme);
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
        const isDark = theme === "dark";
        try {
            // 1. Check user login session
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                toast.error(
                    lang === 'ar' ? "يرجى تسجيل الدخول لتقديم طلبك!" : "Please sign in to place your order!",
                    {
                        style: isDark 
                            ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                            : { border: '1px solid #F59E0B', padding: '16px', color: '#B45309', fontWeight: 'bold' }
                    }
                );
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
                className={`fixed top-0 h-full w-full sm:w-100 bg-white dark:bg-[#121216]/95 border-gray-100 dark:border-[#22222e] z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
                    lang === 'ar'
                        ? `left-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} border-r`
                        : `right-0 ${isOpen ? "translate-x-0" : "translate-x-full"} border-l`
                }`}
            >
                {/* Cart Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#22222e]">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.cartTitle}</h2>
                    <button onClick={closeCart} className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-250 hover:bg-gray-100 dark:hover:bg-[#1a1a24] rounded-full transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cart Items (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                            <p>{t.cartEmpty}</p>
                            <Link 
                                href="/" 
                                onClick={closeCart} 
                                className="mt-4 inline-block text-orange-500 font-bold hover:underline cursor-pointer"
                            >
                                {lang === 'ar' ? "تصفح القائمة" : "Browse Menu"}
                            </Link>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-50 dark:bg-[#161622]/40 p-4 rounded-lg border border-gray-100 dark:border-[#22222e]/45 text-left">
                                <div className="text-left">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{translateMenu(item.name, lang)}</h3>
                                    {item.customization && (
                                        <div className="text-[10px] text-gray-400 dark:text-gray-550 font-semibold mt-0.5 space-y-0.5 text-left pl-1.5 border-l border-orange-500/30 dark:border-orange-500/15 pr-0 border-r-0 rtl:pl-0 rtl:border-l-0 rtl:pr-1.5 rtl:border-r rtl:text-right">
                                            {item.customization.size && (
                                                <p className="leading-tight">
                                                    {lang === 'ar' ? "الحجم:" : "Portion:"} <span className="text-gray-650 dark:text-gray-300 font-bold">{translateAddon(item.customization.size, lang)}</span>
                                                </p>
                                            )}
                                            {(item.customization.addons && item.customization.addons.length > 0) && (
                                                <p className="leading-tight">
                                                    {lang === 'ar' ? "الإضافات:" : "Toppings:"} <span className="text-orange-500 dark:text-orange-450">{item.customization.addons.map(add => translateAddon(add, lang)).join(", ")}</span>
                                                </p>
                                            )}
                                            {item.customization.instructions && (
                                                <p className="italic text-gray-450 dark:text-gray-500 font-normal leading-tight">
                                                    {lang === 'ar' ? "ملاحظة:" : "Note:"} &quot;{item.customization.instructions}&quot;
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        ${item.price.toFixed(2)} x {item.quantity}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <span className="font-bold text-gray-900 dark:text-gray-100">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                    <button
                                        onClick={() => handleEditCartItem(item)}
                                        className="text-orange-400 hover:text-orange-600 transition-colors cursor-pointer"
                                        title={lang === 'ar' ? "تعديل التخصيص" : "Edit Customization"}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                        title={lang === 'ar' ? "إزالة الوجبة" : "Remove Item"}
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
                    <div className="p-6 border-t border-gray-100 dark:border-[#22222e] bg-gray-50 dark:bg-[#161622]/40">
                        <div className="flex justify-between items-center mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">
                            <span>{lang === 'ar' ? "الإجمالي" : "Total"}</span>
                            <span>${cartTotal().toFixed(2)}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer animate-pulse-subtle"
                        >
                            {t.btnCheckout}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}