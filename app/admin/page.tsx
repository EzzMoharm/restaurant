// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isUserAdmin } from "@/lib/supabase/admin";
import { User } from "@supabase/supabase-js";
import { ShieldX, LogOut, ArrowLeft, PlusCircle, LayoutDashboard, Layers, ShoppingBag, AlertCircle, Trash2, Truck, Calendar, RefreshCw, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation, translateMenu } from "@/lib/translations";
import { useSettingsStore } from "@/store/settings";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    category_id: string;
    image_url: string;
    categories?: {
        name: string;
    } | null;
}

interface AdminOrderItem {
    id: string;
    quantity: number;
    price_at_time: number;
    product_id: string;
    products: {
        name: string;
    } | null;
}

interface AdminOrder {
    id: string;
    total_price: number;
    status: string;
    created_at: string;
    user_id: string | null;
    order_items: AdminOrderItem[];
}

interface MetaCustomization {
    size?: string;
    addons?: string[];
    instructions?: string;
}

interface MetaItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    customization?: MetaCustomization;
}

interface OrderDeliveryMeta {
    fullName: string;
    address: string;
    city: string;
    phoneNumber: string;
    paymentMethod: string;
    items?: MetaItem[];
}

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

interface StatusOption {
    value: string;
    labelEn: string;
    labelAr: string;
    colorClass: string;
    darkColorClass: string;
}

const statusOptions: StatusOption[] = [
    {
        value: "pending",
        labelEn: "Pending",
        labelAr: "قيد الانتظار",
        colorClass: "bg-orange-50 text-orange-700 border-orange-250 hover:bg-orange-100",
        darkColorClass: "dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/35 dark:hover:bg-orange-950/30"
    },
    {
        value: "preparing",
        labelEn: "Preparing",
        labelAr: "قيد التحضير",
        colorClass: "bg-blue-50 text-blue-700 border-blue-250 hover:bg-blue-100",
        darkColorClass: "dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/35 dark:hover:bg-blue-950/30"
    },
    {
        value: "ready",
        labelEn: "Ready",
        labelAr: "جاهز للاستلام",
        colorClass: "bg-purple-50 text-purple-700 border-purple-250 hover:bg-purple-100",
        darkColorClass: "dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/35 dark:hover:bg-purple-950/30"
    },
    {
        value: "delivering",
        labelEn: "Delivering",
        labelAr: "جاري التوصيل",
        colorClass: "bg-indigo-50 text-indigo-700 border-indigo-250 hover:bg-indigo-100",
        darkColorClass: "dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/35 dark:hover:bg-indigo-950/30"
    },
    {
        value: "delivered",
        labelEn: "Delivered",
        labelAr: "تم التوصيل",
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100",
        darkColorClass: "dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/35 dark:hover:bg-emerald-950/30"
    },
    {
        value: "cancelled",
        labelEn: "Cancelled",
        labelAr: "تم الإلغاء",
        colorClass: "bg-rose-50 text-rose-700 border-rose-250 hover:bg-rose-100",
        darkColorClass: "dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/35 dark:hover:bg-rose-950/30"
    }
];

export default function AdminPage() {
    const router = useRouter();
    const { t, lang } = useTranslation();

    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isAdminState, setIsAdminState] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryName, setCategoryName] = useState("");
    const [productName, setProductName] = useState("");
    const [price, setPrice] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const [products, setProducts] = useState<Product[]>([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isDeletingProduct, setIsDeletingProduct] = useState<string | null>(null);
    const [manageActiveCategory, setManageActiveCategory] = useState<string>("all");

    const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});
    const [productErrors, setProductErrors] = useState<Record<string, string>>({});

    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
    const [activeDropdownOrderId, setActiveDropdownOrderId] = useState<string | null>(null);

    // Run authentication and session check immediately
    useEffect(() => {
        async function checkSession() {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    router.push("/admin/login");
                    return;
                }

                const adminCheck = isUserAdmin(user);
                setUser(user);
                setIsAdminState(adminCheck);

                if (adminCheck) {
                    await fetchCategories();
                    await fetchProducts();
                    await fetchAllOrders();
                }
            } catch (err) {
                console.error("Auth validation error:", err);
                router.push("/admin/login");
            } finally {
                setAuthLoading(false);
            }
        }
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_OUT" || !session) {
                setUser(null);
                setIsAdminState(false);
                router.push("/admin/login");
            }
        });

        return () => {
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    async function fetchCategories() {
        const isDark = useSettingsStore.getState().theme === "dark";
        const { data, error } = await supabase.from("categories").select("*");

        if (error) {
            toast.error(
                (lang === 'ar' ? "خطأ في قاعدة البيانات: " : "Database Error: ") + error.message,
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                }
            );
            return;
        }

        if (data && data.length > 0) {
            setCategories(data);
            setSelectedCategory(data[0].id);
        }
    }

    async function fetchProducts() {
        const isDark = useSettingsStore.getState().theme === "dark";
        const { data, error } = await supabase
            .from("products")
            .select("*, categories(name)");

        if (error) {
            toast.error(
                (lang === 'ar' ? "خطأ في قاعدة البيانات: " : "Database Error: ") + error.message,
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                }
            );
            return;
        }

        if (data) {
            setProducts(data);
        }
    }

    async function fetchAllOrders() {
        setIsLoadingOrders(true);
        try {
            const { data, error } = await supabase
                .from("orders")
                .select(`
                    id,
                    total_price,
                    status,
                    created_at,
                    user_id,
                    order_items (
                        id,
                        quantity,
                        price_at_time,
                        product_id,
                        products (
                            name
                        )
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) {
                toast.error((lang === 'ar' ? "خطأ في تحميل الطلبات: " : "Error loading orders: ") + error.message);
            } else if (data) {
                setOrders((data as unknown as AdminOrder[]) || []);
            }
        } catch (err) {
            console.error("Fetch all orders error:", err);
            const errMsg = err instanceof Error ? err.message : (lang === 'ar' ? "خطأ في تحميل الطلبات" : "Error loading orders");
            toast.error(errMsg);
        } finally {
            setIsLoadingOrders(false);
        }
    }

    async function handleUpdateOrderStatus(orderId: string, newStatus: string) {
        const isDark = useSettingsStore.getState().theme === "dark";
        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: newStatus })
                .eq("id", orderId);

            if (error) {
                toast.error((lang === 'ar' ? "خطأ في التلبية: " : "Fulfillment Error: ") + error.message);
            } else {
                toast.success(
                    lang === 'ar' 
                        ? `تم تحديث التلبية إلى: ${getStatusLabel(newStatus)}`
                        : `Fulfillment updated to: ${newStatus.toUpperCase()}`,
                    {
                        style: isDark
                            ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                            : { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
                    }
                );
                fetchAllOrders();
            }
        } catch (err) {
            console.error("Update status error:", err);
            const errMsg = err instanceof Error ? err.message : (lang === 'ar' ? "خطأ في التلبية" : "Fulfillment error");
            toast.error(errMsg);
        }
    }

    async function handleDeleteProduct(id: string) {
        const isDark = useSettingsStore.getState().theme === "dark";
        const confirmMsg = lang === 'ar'
            ? "هل أنت متأكد أنك تريد حذف هذه الوجبة؟"
            : "Are you sure you want to delete this product?";
        
        if (!confirm(confirmMsg)) return;

        setIsDeletingProduct(id);

        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

        setIsDeletingProduct(null);

        if (error) {
            toast.error(
                (lang === 'ar' ? "خطأ في حذف الوجبة: " : "Error deleting product: ") + error.message,
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                }
            );
        } else {
            fetchProducts();
            toast.success(
                lang === 'ar' ? "تم حذف الوجبة بنجاح!" : "Product deleted successfully!",
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
                }
            );
        }
    }

    async function handleAddCategory() {
        const isDark = useSettingsStore.getState().theme === "dark";
        setCategoryErrors({});
        if (!categoryName.trim()) {
            setCategoryErrors({ categoryName: lang === 'ar' ? "يرجى إدخال اسم القسم." : "Please enter a category name." });
            toast.error(
                lang === 'ar' ? "يرجى ملء حقول الأقسام المطلوبة." : "Please fill out all category fields.",
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                }
            );
            return;
        }

        setIsAddingCategory(true);

        const slug = categoryName.toLowerCase().replace(/ /g, "-");
        const { error } = await supabase
            .from("categories")
            .insert([{ name: categoryName, slug }]);

        setIsAddingCategory(false);

        if (error) {
            toast.error(
                (lang === 'ar' ? "خطأ في إضافة القسم: " : "Error adding category: ") + error.message,
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                }
            );
        } else {
            setCategoryName("");
            fetchCategories(); // Instantly refresh the dropdown
            toast.success(
                lang === 'ar' ? "تم إضافة القسم بنجاح!" : "Category added successfully!",
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
                }
            );
        }
    }

    async function handleAddProduct() {
        const isDark = useSettingsStore.getState().theme === "dark";
        setProductErrors({});
        const newErrors: Record<string, string> = {};

        if (!productName.trim()) {
            newErrors.productName = lang === 'ar' ? "يرجى إدخال اسم الوجبة." : "Please enter a product name.";
        }
        if (!price.trim()) {
            newErrors.price = lang === 'ar' ? "يرجى إدخال السعر." : "Please enter a price.";
        } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            newErrors.price = lang === 'ar' ? "يرجى إدخال سعر صالح أكبر من 0." : "Please enter a valid price greater than 0.";
        }
        if (imageUrl.trim() && !/^https?:\/\/.+/.test(imageUrl.trim())) {
            newErrors.imageUrl = lang === 'ar' ? "يرجى إدخال رابط صورة صالح." : "Please enter a valid image URL (e.g. http:// or https://).";
        }
        if (!selectedCategory) {
            newErrors.selectedCategory = lang === 'ar' ? "يرجى اختيار القسم المناسب." : "Please select a category.";
        }

        if (Object.keys(newErrors).length > 0) {
            setProductErrors(newErrors);
            toast.error(
                lang === 'ar' ? "يرجى ملء جميع حقول الوجبات بشكل صحيح." : "Please fill in all product fields correctly.",
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                }
            );
            return;
        }

        setIsAddingProduct(true);

        const finalImageUrl = imageUrl.trim() || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500";

        const { error } = await supabase.from("products").insert([
            {
                name: productName.trim(),
                price: parseFloat(price),
                category_id: selectedCategory,
                image_url: finalImageUrl,
            },
        ]);

        setIsAddingProduct(false);

        if (error) {
            toast.error(
                (lang === 'ar' ? "خطأ في إضافة الوجبة: " : "Error adding product: ") + error.message,
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                }
            );
        } else {
            setProductName("");
            setPrice("");
            setImageUrl("");
            fetchProducts();
            toast.success(
                lang === 'ar' ? "تم إضافة الوجبة بنجاح!" : "Product added successfully!",
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
                }
            );
        }
    }

    async function handleSignOut() {
        const isDark = useSettingsStore.getState().theme === "dark";
        await supabase.auth.signOut();
        toast.success(
            lang === 'ar' ? "تم تسجيل الخروج بنجاح." : "Logged out successfully.",
            {
                style: isDark
                    ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                    : { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
            }
        );
        router.push("/");
    }

    function getStatusLabel(status: string) {
        switch (status) {
            case "pending": return lang === 'ar' ? "طلب قيد الانتظار" : "Pending Order";
            case "preparing": return lang === 'ar' ? "قيد التحضير" : "Preparing";
            case "ready": return lang === 'ar' ? "جاهز للاستلام" : "Ready";
            case "delivering": return lang === 'ar' ? "جاري التوصيل" : "Delivering";
            case "delivered": return lang === 'ar' ? "تم التوصيل" : "Delivered";
            case "cancelled": return lang === 'ar' ? "تم الإلغاء" : "Cancelled";
            default: return status;
        }
    }

    // 1. Premium Loading State (Skeleton Loaders and Spinner)
    if (authLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 py-10 px-4">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center border-b border-gray-150 dark:border-[#22222e] pb-4 animate-pulse">
                    <div className="h-9 w-48 bg-gray-250 dark:bg-[#1a1a24] rounded-lg"></div>
                    <div className="h-10 w-24 bg-gray-250 dark:bg-[#1a1a24] rounded-lg"></div>
                </div>
                {/* Form Card 1 Skeleton */}
                <div className="bg-white dark:bg-[#121216] p-6 rounded-xl shadow-md border border-gray-100 dark:border-[#22222e] space-y-4 animate-pulse">
                    <div className="h-6 w-32 bg-gray-250 dark:bg-[#1a1a24] rounded"></div>
                    <div className="flex gap-4">
                        <div className="h-12 bg-gray-250 dark:bg-[#1a1a24] rounded-lg flex-1"></div>
                        <div className="h-12 w-32 bg-gray-250 dark:bg-[#1a1a24] rounded-lg"></div>
                    </div>
                </div>
                {/* Form Card 2 Skeleton */}
                <div className="bg-white dark:bg-[#121216] p-6 rounded-xl shadow-md border border-gray-100 dark:border-[#22222e] space-y-4 animate-pulse">
                    <div className="h-6 w-40 bg-gray-250 dark:bg-[#1a1a24] rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-12 bg-gray-250 dark:bg-[#1a1a24] rounded-lg"></div>
                        <div className="h-12 bg-gray-250 dark:bg-[#1a1a24] rounded-lg"></div>
                        <div className="h-12 bg-gray-250 dark:bg-[#1a1a24] rounded-lg"></div>
                        <div className="h-12 bg-gray-250 dark:bg-[#1a1a24] rounded-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Premium "Access Denied" Screen for Non-Admin Logged In Users
    if (user && !isAdminState) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-br from-red-50 via-white to-gray-50 dark:from-[#09090b] dark:via-[#121216] dark:to-[#0f0f13] relative overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-100/60 dark:bg-red-950/15 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="max-w-md w-full text-center space-y-6 relative z-10 bg-white/90 dark:bg-[#121216] backdrop-blur-md p-8 rounded-3xl shadow-xl border border-red-100 dark:border-red-950/40">
                    <div className="inline-flex p-4 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full animate-bounce">
                        <ShieldX className="w-12 h-12" />
                    </div>
                    
                    <div className="space-y-2">
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                            {t.adminAccessDenied}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm leading-relaxed">
                            {lang === 'ar' ? (
                                <>عذراً! الحساب <span className="font-semibold text-gray-700 dark:text-gray-300">{user.email}</span> لا يمتلك صلاحيات مسؤول النظام.</>
                            ) : (
                                <>Oops! The account <span className="font-semibold text-gray-700 dark:text-gray-300">{user.email}</span> does not have system administrator permissions.</>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={() => router.push("/")}
                            className="flex-1 bg-gray-100 dark:bg-[#1a1a24] hover:bg-gray-200 dark:hover:bg-[#232333] text-gray-800 dark:text-gray-300 border border-gray-200/50 dark:border-[#22222e] font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                        >
                            <ArrowLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                            {t.adminBtnBackHome}
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-red-600/10 flex items-center justify-center gap-2 cursor-pointer text-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            {t.adminBtnSignOut}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const filteredManageProducts = manageActiveCategory === "all"
        ? products
        : products.filter((p) => p.category_id === manageActiveCategory);

    // 3. Render the Protected Dashboard if Authorized Admin
    return (
        <div className="max-w-4xl mx-auto space-y-8 py-10 px-4 relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-100/40 dark:bg-orange-950/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-red-100/40 dark:bg-red-950/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-[#22222e] pb-5 relative z-10 text-start">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2.5">
                        <LayoutDashboard className="w-8 h-8 text-orange-500" />
                        {t.adminDashTitle}
                    </h1>
                    <p className="text-sm text-gray-555 text-gray-500 dark:text-gray-400">
                        {t.adminDashSubtitle} ({t.adminDashLoggedAs} <span className="font-semibold text-gray-700 dark:text-gray-300">{user?.email}</span>)
                    </p>
                </div>
                <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 bg-gray-100 dark:bg-[#1a1a24] hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 border border-gray-200/50 dark:border-[#22222e] text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl font-bold transition-all text-sm cursor-pointer hover:border-red-200 dark:hover:border-red-900/40"
                >
                    <LogOut className="w-4 h-4" />
                    {t.adminBtnSignOut}
                </button>
            </div>

            {/* --- Category Section --- */}
            <section className="bg-white dark:bg-[#121216]/90 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#22222e] space-y-4 hover:shadow-md transition-shadow relative z-10">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b pb-2.5 border-gray-50 dark:border-[#22222e]/40">
                    <Layers className="w-5 h-5 text-green-500" />
                    {t.adminAddCategory}
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 items-start w-full">
                    <div className="flex-1 w-full space-y-1 text-start">
                        <input
                            type="text"
                            placeholder={t.adminCatPlaceholder}
                            className={`border p-3.5 rounded-xl w-full text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all font-medium placeholder-gray-400 dark:placeholder-gray-550 bg-gray-50/50 dark:bg-[#161622]/50 ${
                                categoryErrors.categoryName
                                    ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-gray-200 dark:border-[#22222e] focus:ring-green-500/20 focus:border-green-550"
                            }`}
                            value={categoryName}
                            onChange={(e) => {
                                setCategoryName(e.target.value);
                                if (categoryErrors.categoryName) setCategoryErrors(prev => ({ ...prev, categoryName: "" }));
                            }}
                        />
                        {categoryErrors.categoryName && (
                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                               <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                               {categoryErrors.categoryName}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleAddCategory}
                        disabled={isAddingCategory}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-green-600/10 cursor-pointer text-sm sm:text-base w-full sm:w-auto h-[54px] self-stretch sm:self-start shrink-0"
                    >
                        {isAddingCategory ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {t.adminSaving}
                            </>
                        ) : (
                            <>
                                <PlusCircle className="w-4 h-4" />
                                {t.adminBtnSaveCat}
                            </>
                        )}
                    </button>
                </div>
            </section>

            {/* --- Product Section --- */}
            <section className="bg-white dark:bg-[#121216]/90 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#22222e] space-y-4 hover:shadow-md transition-shadow relative z-10 text-start">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b pb-2.5 border-gray-50 dark:border-[#22222e]/40">
                    <ShoppingBag className="w-5 h-5 text-orange-500" />
                    {t.adminAddProduct}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-550 dark:text-gray-400">{t.adminProdName}</label>
                        <input
                            type="text"
                            placeholder={t.adminProdPlaceholder}
                            className={`w-full border p-3.5 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all font-medium placeholder-gray-400 dark:placeholder-gray-550 bg-gray-50/50 dark:bg-[#161622]/50 ${
                                productErrors.productName
                                    ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-gray-200 dark:border-[#22222e] focus:ring-orange-500/20 focus:border-orange-500"
                            }`}
                            value={productName}
                            onChange={(e) => {
                                setProductName(e.target.value);
                                if (productErrors.productName) setProductErrors(prev => ({ ...prev, productName: "" }));
                            }}
                        />
                        {productErrors.productName && (
                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {productErrors.productName}
                            </span>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-555 dark:text-gray-400">{t.adminPrice}</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder={t.adminPricePlaceholder}
                            className={`w-full border p-3.5 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all font-medium placeholder-gray-400 dark:placeholder-gray-550 bg-gray-50/50 dark:bg-[#161622]/50 ${
                                productErrors.price
                                    ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-gray-200 dark:border-[#22222e] focus:ring-orange-500/20 focus:border-orange-500"
                            }`}
                            value={price}
                            onChange={(e) => {
                                setPrice(e.target.value);
                                if (productErrors.price) setProductErrors(prev => ({ ...prev, price: "" }));
                            }}
                        />
                        {productErrors.price && (
                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {productErrors.price}
                            </span>
                        )}
                    </div>

                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-semibold text-gray-555 dark:text-gray-400">{t.adminImageURL}</label>
                        <input
                            type="text"
                            placeholder="e.g. https://images.unsplash.com/photo-..."
                            className={`w-full border p-3.5 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all font-medium placeholder-gray-400 dark:placeholder-gray-550 bg-gray-50/50 dark:bg-[#161622]/50 ${
                                productErrors.imageUrl
                                    ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-gray-200 dark:border-[#22222e] focus:ring-orange-500/20 focus:border-orange-500"
                            }`}
                            value={imageUrl}
                            onChange={(e) => {
                                setImageUrl(e.target.value);
                                if (productErrors.imageUrl) setProductErrors(prev => ({ ...prev, imageUrl: "" }));
                            }}
                        />
                        {productErrors.imageUrl && (
                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {productErrors.imageUrl}
                            </span>
                        )}
                    </div>

                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-semibold text-gray-555 dark:text-gray-400">{t.adminSelectCategory}</label>
                        <select
                            className={`w-full border p-3.5 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all font-medium bg-white dark:bg-[#121216] border-gray-200 dark:border-[#22222e] ${
                                productErrors.selectedCategory
                                    ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-550"
                                    : "border-gray-200 dark:border-[#22222e] focus:ring-orange-500/20 focus:border-orange-550"
                            }`}
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                if (productErrors.selectedCategory) setProductErrors(prev => ({ ...prev, selectedCategory: "" }));
                            }}
                        >
                            {categories.length === 0 ? (
                                <option value="">{lang === 'ar' ? "جاري تحميل الأقسام..." : "Loading categories..."}</option>
                            ) : (
                                categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{translateMenu(cat.name, lang)}</option>
                                ))
                            )}
                        </select>
                        {productErrors.selectedCategory && (
                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {productErrors.selectedCategory}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleAddProduct}
                        disabled={isAddingProduct}
                        className="md:col-span-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-orange-600/10 cursor-pointer text-sm sm:text-base mt-2"
                    >
                        {isAddingProduct ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {lang === 'ar' ? "جاري إضافة الوجبة..." : "Adding Product..."}
                            </>
                        ) : (
                            <>
                                <PlusCircle className="w-4 h-4" />
                                {t.adminBtnSaveProd}
                            </>
                        )}
                    </button>
                </div>
            </section>

            {/* --- Manage Products Section --- */}
            <section className="bg-white dark:bg-[#121216]/90 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#22222e] space-y-4 hover:shadow-md transition-shadow relative z-10 text-start">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b pb-2.5 border-gray-50 dark:border-[#22222e]/40">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    {t.adminManageHeader}
                </h2>

                {/* Category Pills Navigation Filter */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-100 dark:border-[#22222e]/40">
                        <button
                            onClick={() => setManageActiveCategory("all")}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                manageActiveCategory === "all"
                                    ? "bg-gray-900 text-white dark:bg-orange-500 shadow-sm"
                                    : "bg-gray-100 dark:bg-[#1a1a24] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#232333]"
                            }`}
                        >
                            {lang === 'ar' ? "الكل" : "All"}
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setManageActiveCategory(cat.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                    manageActiveCategory === cat.id
                                        ? "bg-orange-500 text-white shadow-sm"
                                        : "bg-gray-100 dark:bg-[#1a1a24] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#232333]"
                                }`}
                            >
                                {translateMenu(cat.name, lang)}
                            </button>
                        ))}
                    </div>
                )}
                
                {products.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                        {lang === 'ar' ? "لم يتم العثور على وجبات في القائمة." : "No products found in the menu."}
                    </p>
                ) : filteredManageProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                        {lang === 'ar' ? "لم يتم العثور على وجبات في هذا القسم." : "No products found in this category."}
                    </p>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-[#22222e]/30 max-h-96 overflow-y-auto pr-1">
                        {filteredManageProducts.map((prod) => (
                            <div key={prod.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                                <div className="flex items-center gap-3 truncate text-start">
                                    <div
                                        className="w-12 h-12 rounded-xl bg-cover bg-center shrink-0 border border-gray-100 dark:border-[#22222e]/40"
                                        style={{ backgroundImage: `url(${prod.image_url})` }}
                                    />
                                    <div className="truncate">
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                                            {translateMenu(prod.name, lang)}
                                        </h4>
                                        <p className="text-xs text-gray-555 text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400" />
                                            {prod.categories?.name ? translateMenu(prod.categories.name, lang) : (lang === 'ar' ? "غير مصنف" : "Uncategorized")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <span className="font-bold text-sm text-green-600 dark:text-green-400">${prod.price.toFixed(2)}</span>
                                    <button
                                        onClick={() => handleDeleteProduct(prod.id)}
                                        disabled={isDeletingProduct === prod.id}
                                        className="p-2 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl transition-all cursor-pointer disabled:opacity-50 border border-red-100/50 dark:border-red-900/40 hover:border-red-200"
                                        title={t.adminBtnDelete}
                                    >
                                        {isDeletingProduct === prod.id ? (
                                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* --- Manage & Fulfill Orders Section --- */}
            <section className="bg-white dark:bg-[#121216]/90 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#22222e] space-y-4 hover:shadow-md transition-shadow relative z-10 text-start">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-50 dark:border-[#22222e]/40 pb-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-orange-500" />
                        {t.adminActiveOrdersHeader}
                    </h2>
                    <button
                        onClick={fetchAllOrders}
                        disabled={isLoadingOrders}
                        className="inline-flex items-center gap-1 bg-gray-50 dark:bg-[#1a1a24] hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-500 border border-gray-200/60 dark:border-[#22222e] text-gray-550 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                        {lang === 'ar' ? "تحديث الطلبات" : "Sync Orders"}
                    </button>
                </div>

                {isLoadingOrders && orders.length === 0 ? (
                    <div className="flex justify-center items-center py-10 space-y-2 flex-col">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold animate-pulse">
                            {lang === 'ar' ? "جاري تحديث الطلبات..." : "Syncing orders..."}
                        </p>
                    </div>
                ) : orders.length === 0 ? (
                    <p className="text-sm text-gray-555 text-gray-500 dark:text-gray-400 text-center py-8">{t.adminNoOrders}</p>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-[#22222e]/30 max-h-[550px] overflow-y-auto pr-1 space-y-6">
                        {orders.map((order) => {
                            const orderRef = `BF-${order.id.substring(0, 5).toUpperCase()}`;
                            const dateFormatted = new Date(order.created_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            // Try to retrieve address metadata from shared localStorage origin
                            let metaData: OrderDeliveryMeta | null = null;
                            if (typeof window !== "undefined") {
                                const metaStr = localStorage.getItem(`biteflow-order-meta-${order.id}`);
                                if (metaStr) {
                                    metaData = JSON.parse(metaStr);
                                }
                            }

                            return (
                                <div key={order.id} className="pt-6 first:pt-0 space-y-3.5 text-start">
                                    {/* Order Meta Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50/50 dark:bg-[#1a1a24]/30 p-3 rounded-xl border border-gray-100/50 dark:border-[#22222e]/40">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-extrabold text-gray-800 dark:text-gray-250 tracking-wide">{orderRef}</span>
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {dateFormatted}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate max-w-[280px]">
                                                {lang === 'ar' ? "العميل:" : "Cust:"} <span className="font-semibold text-gray-600 dark:text-gray-300">{order.user_id || (lang === 'ar' ? "زائر" : "Guest")}</span>
                                            </p>
                                        </div>

                                        {/* Dropdown status changer */}
                                        <div className="flex items-center gap-2 shrink-0 relative">
                                            <span className="text-xs font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wide">
                                                {lang === 'ar' ? "الحالة:" : "Status:"}
                                            </span>
                                            
                                            <button
                                                onClick={() => setActiveDropdownOrderId(activeDropdownOrderId === order.id ? null : order.id)}
                                                className={`flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-300 shadow-xs cursor-pointer select-none ${
                                                    statusOptions.find(opt => opt.value === order.status)?.colorClass || ""
                                                } ${
                                                    statusOptions.find(opt => opt.value === order.status)?.darkColorClass || ""
                                                }`}
                                            >
                                                <span>{getStatusLabel(order.status)}</span>
                                                <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-300 ${activeDropdownOrderId === order.id ? 'rotate-180' : ''}`} />
                                            </button>

                                             {activeDropdownOrderId === order.id && (
                                                 <>
                                                     <div 
                                                         className="fixed inset-0 z-40" 
                                                         onClick={() => setActiveDropdownOrderId(null)} 
                                                     />
                                                     
                                                     <div className={`absolute top-full ${lang === 'ar' ? 'left-0' : 'right-0'} mt-1.5 w-44 rounded-2xl bg-white dark:bg-[#1a1a24] border border-gray-100 dark:border-[#2b2b3b]/60 shadow-xl py-2 z-50 animate-fadeIn overflow-hidden`}>
                                                         {statusOptions.map((opt) => (
                                                             <button
                                                                 key={opt.value}
                                                                 onClick={() => {
                                                                     handleUpdateOrderStatus(order.id, opt.value);
                                                                     setActiveDropdownOrderId(null);
                                                                 }}
                                                                 className={`w-full text-start px-4 py-2 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                                                                     order.status === opt.value
                                                                         ? "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400"
                                                                         : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-[#232333]/50"
                                                                 }`}
                                                             >
                                                                 <span>{lang === 'ar' ? opt.labelAr : opt.labelEn}</span>
                                                                 {order.status === opt.value && (
                                                                     <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                                 )}
                                                             </button>
                                                         ))}
                                                     </div>
                                                 </>
                                             )}
                                        </div>
                                    </div>

                                    {/* Order Receipt and Delivery row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                        {/* Left col: list items */}
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-0.5">
                                                {lang === 'ar' ? "الوجبات المطلوبة" : "Items"}
                                            </span>
                                            <div className="bg-white dark:bg-[#121216] rounded-xl border border-gray-100 dark:border-[#22222e] p-3 divide-y divide-gray-50 dark:divide-[#22222e]/30 space-y-1.5">
                                                {metaData && metaData.items ? (
                                                    metaData.items.map((metaItem: MetaItem, idx: number) => (
                                                        <div key={idx} className="py-2 first:pt-0 last:pb-0 text-start">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                                                    {translateMenu(metaItem.name, lang)} <span className="font-bold text-gray-500 dark:text-gray-450">x{metaItem.quantity}</span>
                                                                </span>
                                                                <span className="font-bold text-gray-900 dark:text-gray-100 shrink-0">${(metaItem.price * metaItem.quantity).toFixed(2)}</span>
                                                            </div>
                                                            {metaItem.customization && (
                                                                <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold space-y-0.5 mt-0.5 ps-1.5 border-s border-orange-500/30 text-start">
                                                                    {metaItem.customization.size && (
                                                                        <p className="leading-tight">
                                                                            {lang === 'ar' ? "الحجم:" : "Portion:"} <span className="text-gray-600 dark:text-gray-300 font-bold">{translateAddon(metaItem.customization.size, lang)}</span>
                                                                        </p>
                                                                    )}
                                                                    {(metaItem.customization.addons && metaItem.customization.addons.length > 0) && (
                                                                        <p className="leading-tight">
                                                                            {lang === 'ar' ? "الإضافات:" : "Add-ons:"} <span className="text-orange-500 dark:text-orange-450">{metaItem.customization.addons.map(add => translateAddon(add, lang)).join(", ")}</span>
                                                                        </p>
                                                                    )}
                                                                    {metaItem.customization.instructions && (
                                                                        <p className="italic text-gray-400 dark:text-gray-550 font-normal leading-tight">
                                                                            {lang === 'ar' ? "ملاحظة:" : "Note:"} &quot;{metaItem.customization.instructions}&quot;
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    order.order_items?.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0">
                                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                                {item.products ? translateMenu(item.products.name, lang) : (lang === 'ar' ? "طبق محذوف" : "Deleted Dish")} <span className="font-bold text-gray-500 dark:text-gray-450">x{item.quantity}</span>
                                                            </span>
                                                            <span className="font-bold text-gray-900 dark:text-gray-150">${(item.price_at_time * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))
                                                )}
                                                <div className="flex justify-between border-t border-gray-50 dark:border-[#22222e]/40 pt-2 font-extrabold text-orange-600 dark:text-orange-450 text-sm">
                                                    <span>{lang === 'ar' ? "المجموع الكلي" : "Grand Total"}</span>
                                                    <span>${order.total_price.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right col: Delivery metadata info */}
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-0.5">
                                                {lang === 'ar' ? "تفاصيل التوصيل" : "Delivery info"}
                                            </span>
                                            <div className="bg-white dark:bg-[#121216] rounded-xl border border-gray-100 dark:border-[#22222e] p-3 space-y-2 text-gray-650 text-gray-600 dark:text-gray-300 font-medium">
                                                {metaData ? (
                                                    <>
                                                        <div>
                                                            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase block tracking-wider">{t.successRecipient}</span>
                                                            <span className="text-gray-800 dark:text-gray-200 font-semibold text-xs">{metaData.fullName}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-550 uppercase block tracking-wider">{t.successDestination}</span>
                                                            <span className="text-gray-800 dark:text-gray-200 text-xs">{metaData.address}, {metaData.city}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-550 uppercase block tracking-wider">{t.successPhone}</span>
                                                                <span className="text-gray-800 dark:text-gray-200 text-xs">{metaData.phoneNumber}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-550 uppercase block tracking-wider">{t.successPayment}</span>
                                                                <span className="text-gray-800 dark:text-gray-200 text-xs uppercase font-bold">
                                                                    {metaData.paymentMethod === 'card' ? t.checkoutPaymentCard : t.checkoutPaymentCod}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-gray-400 dark:text-gray-550 text-xs text-center py-6 italic font-normal">
                                                        {lang === 'ar'
                                                            ? "لا يوجد تفاصيل شحن محفوظة محلياً لهذا الطلب."
                                                            : "No local metadata cache exists for this order. Showing placeholder defaults."
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}