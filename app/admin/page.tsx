// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isUserAdmin } from "@/lib/supabase/admin";
import { User } from "@supabase/supabase-js";
import { ShieldX, LogOut, ArrowLeft, PlusCircle, LayoutDashboard, Layers, ShoppingBag, AlertCircle, Trash2, Truck, Calendar, RefreshCw, ChevronDown, Clock, Flame, PackageCheck, CircleCheckBig, Ban, TrendingUp, Activity, BarChart3, Crown, Tag, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation, translateMenu } from "@/lib/translations";
import { useSettingsStore } from "@/store/settings";
import { sanitizeText, sanitizeCode, sanitizeDecimal, sanitizeInteger, sanitizeUrl } from "@/lib/security";

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
    is_available: boolean;
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
    icon: React.ReactNode;
    dotColor: string;
}

const statusOptions: StatusOption[] = [
    {
        value: "pending",
        labelEn: "Pending",
        labelAr: "قيد الانتظار",
        colorClass: "bg-orange-50 text-orange-700 border-orange-250 hover:bg-orange-100",
        darkColorClass: "dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/35 dark:hover:bg-orange-950/30",
        icon: <Clock className="w-3.5 h-3.5" />,
        dotColor: "bg-orange-400"
    },
    {
        value: "preparing",
        labelEn: "Preparing",
        labelAr: "قيد التحضير",
        colorClass: "bg-blue-50 text-blue-700 border-blue-250 hover:bg-blue-100",
        darkColorClass: "dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/35 dark:hover:bg-blue-950/30",
        icon: <Flame className="w-3.5 h-3.5" />,
        dotColor: "bg-blue-400"
    },
    {
        value: "ready",
        labelEn: "Ready",
        labelAr: "جاهز للاستلام",
        colorClass: "bg-purple-50 text-purple-700 border-purple-250 hover:bg-purple-100",
        darkColorClass: "dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/35 dark:hover:bg-purple-950/30",
        icon: <PackageCheck className="w-3.5 h-3.5" />,
        dotColor: "bg-purple-400"
    },
    {
        value: "delivering",
        labelEn: "Delivering",
        labelAr: "جاري التوصيل",
        colorClass: "bg-indigo-50 text-indigo-700 border-indigo-250 hover:bg-indigo-100",
        darkColorClass: "dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/35 dark:hover:bg-indigo-950/30",
        icon: <Truck className="w-3.5 h-3.5" />,
        dotColor: "bg-indigo-400"
    },
    {
        value: "delivered",
        labelEn: "Delivered",
        labelAr: "تم التوصيل",
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100",
        darkColorClass: "dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/35 dark:hover:bg-emerald-950/30",
        icon: <CircleCheckBig className="w-3.5 h-3.5" />,
        dotColor: "bg-emerald-400"
    },
    {
        value: "cancelled",
        labelEn: "Cancelled",
        labelAr: "تم الإلغاء",
        colorClass: "bg-rose-50 text-rose-700 border-rose-250 hover:bg-rose-100",
        darkColorClass: "dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/35 dark:hover:bg-rose-950/30",
        icon: <Ban className="w-3.5 h-3.5" />,
        dotColor: "bg-rose-400"
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
    const [isDeletingCoupon, setIsDeletingCoupon] = useState<string | null>(null);
    const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; name: string; type: 'product' | 'coupon' } | null>(null);
    const [manageActiveCategory, setManageActiveCategory] = useState<string>("all");

    const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});
    const [productErrors, setProductErrors] = useState<Record<string, string>>({});

    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
    const [activeDropdownOrderId, setActiveDropdownOrderId] = useState<string | null>(null);

    // Coupon Management State (Feature 4)
    interface Coupon {
        id: string;
        code: string;
        discount_type: string;
        discount_value: number;
        is_active: boolean;
        expiry_date: string | null;
        min_order_amount: number;
        max_uses: number | null;
        current_uses: number;
        created_at: string;
    }
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [couponCode, setCouponCode] = useState("");
    const [couponType, setCouponType] = useState<"percentage" | "fixed">("percentage");
    const [couponValue, setCouponValue] = useState("");
    const [couponExpiry, setCouponExpiry] = useState("");
    const [couponMinOrder, setCouponMinOrder] = useState("");
    const [couponMaxUses, setCouponMaxUses] = useState("");
    const [isAddingCoupon, setIsAddingCoupon] = useState(false);

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
                    await fetchCoupons();
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

    // Realtime subscription for live order updates (Feature 1)
    useEffect(() => {
        if (!isAdminState) return;

        const channel = supabase
            .channel('admin-orders-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                () => {
                    fetchAllOrders();
                    toast.success(
                        lang === 'ar' ? "تم استلام طلب جديد!" : "New order received!",
                        {
                            style: {
                                border: '1px solid #10B981',
                                padding: '16px',
                                color: '#047857',
                                fontWeight: 'bold'
                            }
                        }
                    );
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders' },
                () => {
                    fetchAllOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdminState, lang]);

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
        
        setIsDeletingProduct(id);

        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

        setIsDeletingProduct(null);
        setDeleteConfirmTarget(null);

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

    async function handleToggleAvailability(productId: string, currentAvailability: boolean) {
        const newAvailability = !currentAvailability;
        const { error } = await supabase
            .from("products")
            .update({ is_available: newAvailability })
            .eq("id", productId);

        if (error) {
            toast.error(
                (lang === 'ar' ? "خطأ في تحديث حالة المنتج: " : "Error updating availability: ") + error.message
            );
        } else {
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_available: newAvailability } : p));
            toast.success(
                newAvailability
                    ? (lang === 'ar' ? "المنتج متاح الآن!" : "Product is now available!")
                    : (lang === 'ar' ? "المنتج غير متاح حالياً." : "Product marked as out of stock."),
                {
                    style: {
                        border: `1px solid ${newAvailability ? '#10B981' : '#F59E0B'}`,
                        padding: '16px',
                        color: newAvailability ? '#047857' : '#B45309',
                        fontWeight: 'bold'
                    }
                }
            );
        }
    }

    // Coupon CRUD Functions (Feature 4)
    async function fetchCoupons() {
        const { data, error } = await supabase
            .from("coupons")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setCoupons(data);
        }
    }

    async function handleAddCoupon() {
        const isDark = useSettingsStore.getState().theme === "dark";
        const cleanCode = sanitizeCode(couponCode);
        const cleanValue = sanitizeDecimal(couponValue);
        const cleanMinOrder = sanitizeDecimal(couponMinOrder);
        const cleanMaxUses = sanitizeInteger(couponMaxUses);

        if (!cleanCode || !cleanValue) {
            toast.error(
                lang === 'ar' ? "يرجى ملء حقل الكود والقيمة." : "Please fill in the code and value fields.",
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                }
            );
            return;
        }

        setIsAddingCoupon(true);

        const insertData: Record<string, unknown> = {
            code: cleanCode,
            discount_type: couponType,
            discount_value: parseFloat(cleanValue),
            is_active: true,
            min_order_amount: cleanMinOrder ? parseFloat(cleanMinOrder) : 0,
            max_uses: cleanMaxUses ? parseInt(cleanMaxUses) : null,
            expiry_date: couponExpiry || null,
        };

        const { error } = await supabase.from("coupons").insert(insertData);

        if (error) {
            toast.error(
                (lang === 'ar' ? "خطأ في إنشاء الكوبون: " : "Error creating coupon: ") + error.message,
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                }
            );
        } else {
            toast.success(
                lang === 'ar' ? "تم إنشاء الكوبون بنجاح!" : "Coupon created successfully!",
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
                }
            );
            setCouponCode("");
            setCouponValue("");
            setCouponExpiry("");
            setCouponMinOrder("");
            setCouponMaxUses("");
            fetchCoupons();
        }

        setIsAddingCoupon(false);
    }

    async function handleToggleCoupon(couponId: string, currentActive: boolean) {
        const isDark = useSettingsStore.getState().theme === "dark";
        const { error } = await supabase
            .from("coupons")
            .update({ is_active: !currentActive })
            .eq("id", couponId);

        if (error) {
            toast.error(
                (lang === 'ar' ? "خطأ في تحديث الكوبون: " : "Error updating coupon: ") + error.message,
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                }
            );
        } else {
            setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, is_active: !currentActive } : c));
        }
    }

    async function handleDeleteCoupon(couponId: string) {
        const isDark = useSettingsStore.getState().theme === "dark";
        setIsDeletingCoupon(couponId);
        const { error } = await supabase.from("coupons").delete().eq("id", couponId);
        setIsDeletingCoupon(null);
        setDeleteConfirmTarget(null);
        if (error) {
            toast.error(
                (lang === 'ar' ? "خطأ في حذف الكوبون: " : "Error deleting coupon: ") + error.message,
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                }
            );
        } else {
            setCoupons(prev => prev.filter(c => c.id !== couponId));
            toast.success(
                lang === 'ar' ? "تم حذف الكوبون." : "Coupon deleted.",
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
        const cleanName = sanitizeText(categoryName);
        if (!cleanName) {
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

        const slug = cleanName.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
        const { error } = await supabase
            .from("categories")
            .insert([{ name: cleanName, slug }]);

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

        const cleanName = sanitizeText(productName);
        const cleanPrice = sanitizeDecimal(price);
        const cleanImageUrl = sanitizeUrl(imageUrl.trim());

        if (!cleanName) {
            newErrors.productName = lang === 'ar' ? "يرجى إدخال اسم الوجبة." : "Please enter a product name.";
        }
        if (!cleanPrice) {
            newErrors.price = lang === 'ar' ? "يرجى إدخال السعر." : "Please enter a price.";
        } else if (isNaN(parseFloat(cleanPrice)) || parseFloat(cleanPrice) <= 0) {
            newErrors.price = lang === 'ar' ? "يرجى إدخال سعر صالح أكبر من 0." : "Please enter a valid price greater than 0.";
        }
        if (cleanImageUrl && !/^https?:\/\/.+/.test(cleanImageUrl)) {
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

        const finalImageUrl = cleanImageUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500";

        const { error } = await supabase.from("products").insert([
            {
                name: cleanName,
                price: parseFloat(cleanPrice),
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

            {/* --- Business Analytics Section (Feature 3) --- */}
            {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const deliveredOrders = orders.filter(o => o.status === 'delivered');
                const todayDelivered = deliveredOrders.filter(o => {
                    const d = new Date(o.created_at);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime() === today.getTime();
                });
                const todayRevenue = todayDelivered.reduce((sum, o) => sum + o.total_price, 0);

                const activeOrderCount = orders.filter(o =>
                    ['pending', 'preparing', 'ready', 'delivering'].includes(o.status)
                ).length;

                const totalSalesCount = deliveredOrders.length;

                // Calculate most popular item from order_items
                const itemFrequency: Record<string, { name: string; count: number }> = {};
                orders.forEach(order => {
                    order.order_items?.forEach(item => {
                        const name = item.products?.name || 'Unknown';
                        if (!itemFrequency[name]) {
                            itemFrequency[name] = { name, count: 0 };
                        }
                        itemFrequency[name].count += item.quantity;
                    });
                });
                const popularItem = Object.values(itemFrequency).sort((a, b) => b.count - a.count)[0];

                const analyticsCards = [
                    {
                        label: t.adminRevenue,
                        value: `$${todayRevenue.toFixed(2)}`,
                        icon: <TrendingUp className="w-5 h-5" />,
                        gradient: 'from-emerald-500/10 to-green-500/10 dark:from-emerald-950/30 dark:to-green-950/30',
                        iconBg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
                        borderColor: 'border-emerald-100 dark:border-emerald-900/30'
                    },
                    {
                        label: t.adminActiveOrders,
                        value: `${activeOrderCount}`,
                        icon: <Activity className="w-5 h-5" />,
                        gradient: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-950/30 dark:to-indigo-950/30',
                        iconBg: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
                        borderColor: 'border-blue-100 dark:border-blue-900/30'
                    },
                    {
                        label: t.adminTotalSales,
                        value: `${totalSalesCount}`,
                        icon: <BarChart3 className="w-5 h-5" />,
                        gradient: 'from-violet-500/10 to-purple-500/10 dark:from-violet-950/30 dark:to-purple-950/30',
                        iconBg: 'bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
                        borderColor: 'border-violet-100 dark:border-violet-900/30'
                    },
                    {
                        label: t.adminPopularItem,
                        value: popularItem ? translateMenu(popularItem.name, lang) : (t.adminNoSalesYet),
                        icon: <Crown className="w-5 h-5" />,
                        gradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-950/30 dark:to-orange-950/30',
                        iconBg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
                        borderColor: 'border-amber-100 dark:border-amber-900/30'
                    }
                ];

                return (
                    <section className="relative z-10 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-start">
                            <BarChart3 className="w-5 h-5 text-orange-500" />
                            {t.adminAnalyticsTitle}
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {analyticsCards.map((card, idx) => (
                                <div
                                    key={idx}
                                    className={`bg-gradient-to-br ${card.gradient} backdrop-blur-sm p-5 rounded-2xl border ${card.borderColor} shadow-sm hover:shadow-md transition-all space-y-3`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                                        {card.icon}
                                    </div>
                                    <div className="space-y-0.5 text-start">
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{card.label}</p>
                                        <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 truncate">{card.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })()}

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
                                setPrice(sanitizeDecimal(e.target.value));
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
                                <div className="flex items-center gap-3 shrink-0">
                                    {/* Availability Toggle */}
                                    <button
                                        onClick={() => handleToggleAvailability(prod.id, prod.is_available)}
                                        className={`relative w-10 h-5.5 rounded-full transition-colors duration-300 cursor-pointer ${
                                            prod.is_available !== false
                                                ? 'bg-emerald-500'
                                                : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                        title={prod.is_available !== false ? t.adminToggleAvailable : t.adminToggleUnavailable}
                                    >
                                        <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                                            prod.is_available !== false ? 'left-5' : 'left-0.5'
                                        }`} />
                                    </button>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide min-w-[52px] text-center ${
                                        prod.is_available !== false
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-gray-400 dark:text-gray-500'
                                    }`}>
                                        {prod.is_available !== false ? t.adminToggleAvailable : t.adminToggleUnavailable}
                                    </span>
                                    <span className="font-bold text-sm text-green-600 dark:text-green-400">${prod.price.toFixed(2)}</span>
                                    <button
                                        onClick={() => setDeleteConfirmTarget({ id: prod.id, name: prod.name, type: 'product' })}
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
                                                className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-300 shadow-xs cursor-pointer select-none ${
                                                    statusOptions.find(opt => opt.value === order.status)?.colorClass || ""
                                                } ${
                                                    statusOptions.find(opt => opt.value === order.status)?.darkColorClass || ""
                                                }`}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    {statusOptions.find(opt => opt.value === order.status)?.icon}
                                                    {getStatusLabel(order.status)}
                                                </span>
                                                <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-300 ${activeDropdownOrderId === order.id ? 'rotate-180' : ''}`} />
                                            </button>

                                             {activeDropdownOrderId === order.id && (
                                                 <>
                                                     <div 
                                                         className="fixed inset-0 z-40 bg-black/5 dark:bg-black/15 backdrop-blur-[1px]" 
                                                         onClick={() => setActiveDropdownOrderId(null)} 
                                                     />
                                                     
                                                     <div 
                                                         className={`absolute top-full ${lang === 'ar' ? 'left-0' : 'right-0'} mt-2 w-52 rounded-2xl bg-white/95 dark:bg-[#1a1a24]/95 backdrop-blur-xl border border-gray-200/70 dark:border-[#2b2b3b]/60 shadow-2xl z-50 overflow-hidden`}
                                                         style={{ animation: 'dropdownSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                                                     >
                                                         {/* Dropdown header */}
                                                         <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#2b2b3b]/40">
                                                             <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                                 {lang === 'ar' ? 'تغيير الحالة' : 'Update Status'}
                                                             </p>
                                                         </div>
                                                         
                                                         <div className="py-1.5">
                                                             {statusOptions.map((opt, idx) => (
                                                                 <div key={opt.value}>
                                                                     {/* Divider before cancelled */}
                                                                     {idx === statusOptions.length - 1 && (
                                                                         <div className="mx-3 my-1 border-t border-gray-100 dark:border-[#2b2b3b]/40" />
                                                                     )}
                                                                     <button
                                                                         onClick={() => {
                                                                             handleUpdateOrderStatus(order.id, opt.value);
                                                                             setActiveDropdownOrderId(null);
                                                                         }}
                                                                         className={`w-full text-start px-3.5 py-2 text-xs font-semibold transition-all duration-200 flex items-center gap-2.5 cursor-pointer group ${
                                                                             order.status === opt.value
                                                                                 ? `${opt.colorClass} ${opt.darkColorClass}`
                                                                                 : "text-gray-600 hover:bg-gray-50 dark:text-gray-350 dark:hover:bg-[#232333]/50"
                                                                         }`}
                                                                     >
                                                                         {/* Colored dot */}
                                                                         <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor} ${
                                                                             order.status === opt.value ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-[#1a1a24] ring-current scale-110' : 'opacity-50 group-hover:opacity-80'
                                                                         } transition-all duration-200`} />
                                                                         
                                                                         {/* Icon + Label */}
                                                                         <span className={`flex items-center gap-1.5 flex-1 ${
                                                                             order.status === opt.value ? '' : 'opacity-70 group-hover:opacity-100'
                                                                         } transition-opacity duration-200`}>
                                                                             {opt.icon}
                                                                             <span className="font-bold">{lang === 'ar' ? opt.labelAr : opt.labelEn}</span>
                                                                         </span>
                                                                         
                                                                         {/* Active check */}
                                                                         {order.status === opt.value && (
                                                                             <CircleCheckBig className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                                                         )}
                                                                     </button>
                                                                 </div>
                                                             ))}
                                                         </div>
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

            {/* --- Coupon Code Management Section (Feature 4) --- */}
            <section className="bg-white dark:bg-[#121216]/90 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#22222e] space-y-5 hover:shadow-md transition-shadow relative z-10">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b pb-2.5 border-gray-50 dark:border-[#22222e]/40">
                    <Tag className="w-5 h-5 text-orange-500" />
                    {t.adminCouponsHeader}
                </h2>

                {/* Add Coupon Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.adminCouponCode}</label>
                        <input
                            type="text"
                            placeholder="e.g. SUMMER20"
                            value={couponCode}
                            onChange={(e) => setCouponCode(sanitizeCode(e.target.value))}
                            className="w-full border border-gray-200 dark:border-[#22222e] p-2.5 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50/50 dark:bg-[#161622]/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold uppercase tracking-wider"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.adminCouponType}</label>
                        <select
                            value={couponType}
                            onChange={(e) => setCouponType(e.target.value as "percentage" | "fixed")}
                            className="w-full border border-gray-200 dark:border-[#22222e] p-2.5 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-gray-50/50 dark:bg-[#161622]/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                        >
                            <option value="percentage">{t.adminCouponPercentage}</option>
                            <option value="fixed">{t.adminCouponFixed}</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.adminCouponValue}</label>
                        <input
                            type="text"
                            placeholder={couponType === 'percentage' ? "e.g. 15" : "e.g. 5.00"}
                            value={couponValue}
                            onChange={(e) => setCouponValue(sanitizeDecimal(e.target.value))}
                            className="w-full border border-gray-200 dark:border-[#22222e] p-2.5 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-550 bg-gray-50/50 dark:bg-[#161622]/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.adminCouponExpiry}</label>
                        <input
                            type="date"
                            value={couponExpiry}
                            onChange={(e) => setCouponExpiry(e.target.value)}
                            className="w-full border border-gray-200 dark:border-[#22222e] p-2.5 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-gray-50/50 dark:bg-[#161622]/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.adminCouponMinOrder}</label>
                        <input
                            type="text"
                            placeholder="0.00"
                            value={couponMinOrder}
                            onChange={(e) => setCouponMinOrder(sanitizeDecimal(e.target.value))}
                            className="w-full border border-gray-200 dark:border-[#22222e] p-2.5 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-550 bg-gray-50/50 dark:bg-[#161622]/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.adminCouponMaxUses}</label>
                        <input
                            type="number"
                            placeholder={lang === 'ar' ? "غير محدود" : "Unlimited"}
                            value={couponMaxUses}
                            onChange={(e) => setCouponMaxUses(e.target.value)}
                            className="w-full border border-gray-200 dark:border-[#22222e] p-2.5 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50/50 dark:bg-[#161622]/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                        />
                    </div>
                </div>

                <button
                    onClick={handleAddCoupon}
                    disabled={isAddingCoupon}
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md shadow-orange-500/10 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm"
                >
                    {isAddingCoupon ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {t.adminCouponSaving}
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            {t.adminBtnAddCoupon}
                        </>
                    )}
                </button>

                {/* Coupons List */}
                {coupons.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                        {t.adminCouponNone}
                    </p>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-[#22222e]/30 max-h-80 overflow-y-auto">
                        {coupons.map((coupon) => {
                            const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
                            const isMaxed = coupon.max_uses && coupon.current_uses >= coupon.max_uses;

                            return (
                                <div key={coupon.id} className="flex flex-wrap items-center justify-between py-3.5 gap-3 text-start">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${coupon.is_active && !isExpired && !isMaxed ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                        <div className="min-w-0">
                                            <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100 tracking-wider block">{coupon.code}</span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value.toFixed(2)}`}
                                                {coupon.min_order_amount > 0 && ` · ${lang === 'ar' ? 'الحد الأدنى' : 'Min'} $${coupon.min_order_amount}`}
                                                {' · '}{t.adminCouponUses}: {coupon.current_uses}/{coupon.max_uses || '∞'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {isExpired && (
                                            <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">{t.adminCouponExpired}</span>
                                        )}
                                        {isMaxed && !isExpired && (
                                            <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full">Maxed</span>
                                        )}
                                        <button
                                            onClick={() => handleToggleCoupon(coupon.id, coupon.is_active)}
                                            className={`relative w-9 h-5 rounded-full transition-colors duration-300 cursor-pointer ${
                                                coupon.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                        >
                                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
                                                coupon.is_active ? 'left-4.5' : 'left-0.5'
                                            }`} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmTarget({ id: coupon.id, name: coupon.code, type: 'coupon' })}
                                            className="p-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 rounded-lg transition-all cursor-pointer"
                                            disabled={isDeletingCoupon === coupon.id}
                                        >
                                            {isDeletingCoupon === coupon.id ? (
                                                <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Premium Custom Delete Confirmation Modal */}
            {deleteConfirmTarget && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-[#121216] rounded-3xl max-w-sm w-full p-6 border border-gray-100 dark:border-[#22222e] shadow-2xl relative space-y-6 text-center animate-scaleUp">
                        {/* Red warning icon */}
                        <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center ring-4 ring-red-50/50 dark:ring-red-950/20">
                            <Trash2 className="w-8 h-8" />
                        </div>

                        {/* Title and Description */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
                                {deleteConfirmTarget.type === 'product' ? (
                                    lang === 'ar' ? "حذف هذه الوجبة؟" : "Delete this product?"
                                ) : (
                                    lang === 'ar' ? "حذف هذا الكوبون؟" : "Delete this coupon?"
                                )}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                                {deleteConfirmTarget.type === 'product' ? (
                                    lang === 'ar' ? (
                                        <>سيؤدي هذا إلى حذف الوجبة <span className="font-extrabold text-gray-700 dark:text-gray-300">{deleteConfirmTarget.name}</span> نهائياً من قائمتك. لا يمكن التراجع عن هذا الإجراء.</>
                                    ) : (
                                        <>This will permanently remove the product <span className="font-extrabold text-gray-700 dark:text-gray-300">{deleteConfirmTarget.name}</span> from your menu. This action cannot be undone.</>
                                    )
                                ) : (
                                    lang === 'ar' ? (
                                        <>سيؤدي هذا إلى حذف الكوبون <span className="font-extrabold text-gray-700 dark:text-gray-300">{deleteConfirmTarget.name}</span> نهائياً. لن يتمكن العملاء من استخدامه بعد الآن.</>
                                    ) : (
                                        <>This will permanently delete the coupon <span className="font-extrabold text-gray-700 dark:text-gray-300">{deleteConfirmTarget.name}</span>. Customers will no longer be able to use it.</>
                                    )
                                )}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteConfirmTarget(null)}
                                className="flex-1 bg-gray-100 dark:bg-[#1a1a24] hover:bg-gray-200 dark:hover:bg-[#232333] text-gray-700 dark:text-gray-300 font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wide border border-gray-200/50 dark:border-[#22222e]/80"
                            >
                                {deleteConfirmTarget.type === 'product' ? (
                                    lang === 'ar' ? "إلغاء" : "Keep Product"
                                ) : (
                                    lang === 'ar' ? "إلغاء" : "Keep Coupon"
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    if (deleteConfirmTarget.type === 'product') {
                                        handleDeleteProduct(deleteConfirmTarget.id);
                                    } else {
                                        handleDeleteCoupon(deleteConfirmTarget.id);
                                    }
                                }}
                                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs uppercase tracking-wide flex items-center justify-center gap-1.5"
                                disabled={
                                    deleteConfirmTarget.type === 'product' 
                                        ? isDeletingProduct === deleteConfirmTarget.id
                                        : isDeletingCoupon === deleteConfirmTarget.id
                                }
                            >
                                {(deleteConfirmTarget.type === 'product' ? isDeletingProduct === deleteConfirmTarget.id : isDeletingCoupon === deleteConfirmTarget.id) ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {lang === 'ar' ? "جاري الحذف..." : "Removing..."}
                                    </>
                                ) : (
                                    lang === 'ar' ? "حذف" : "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}