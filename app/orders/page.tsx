// app/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart";
import toast from "react-hot-toast";
import { 
    ShoppingBag, Calendar, ChevronDown, ChevronUp, 
    Sparkles, ArrowRight, CheckCircle2, Utensils, Truck, RefreshCw, MapPin, Trash2
} from "lucide-react";
import { useTranslation, translateMenu } from "@/lib/translations";

interface ProductData {
    name: string;
    image_url: string;
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

interface OrderItem {
    id: string;
    quantity: number;
    price_at_time: number;
    product_id: string;
    products: ProductData | null;
}

interface Order {
    id: string;
    total_price: number;
    status: string;
    created_at: string;
    order_items: OrderItem[];
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
            "Large": "كبير"
        };
        return map[addon] || addon;
    }
    return addon;
};

export default function CustomerOrdersPage() {
    const router = useRouter();
    const { t, lang } = useTranslation();
    const [userId, setUserId] = useState<string | null>(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [isReorderingMap, setIsReorderingMap] = useState<Record<string, boolean>>({});
    const [isDeletingMap, setIsDeletingMap] = useState<Record<string, boolean>>({});
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const addItem = useCartStore((state) => state.addItem);
    const openCart = useCartStore((state) => state.openCart);

    async function handleDeleteOrder(orderId: string) {
        setIsDeletingMap(prev => ({ ...prev, [orderId]: true }));

        try {
            const { error } = await supabase
                .from("orders")
                .delete()
                .eq("id", orderId);

            if (error) {
                toast.error((lang === 'ar' ? "فشل في حذف الطلب: " : "Failed to delete order: ") + error.message);
            } else {
                toast.success(lang === 'ar' ? "تم إزالة الطلب من السجل بنجاح." : "Order removed from history.", {
                    style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
                });
                setOrders(prev => prev.filter(o => o.id !== orderId));
                localStorage.removeItem(`biteflow-order-meta-${orderId}`);
            }
        } catch (err) {
            console.error("Delete order error:", err);
            toast.error(lang === 'ar' ? "حدث خطأ غير متوقع أثناء حذف الطلب." : "An unexpected error occurred while deleting the order.");
        } finally {
            setIsDeletingMap(prev => ({ ...prev, [orderId]: false }));
            setConfirmDeleteId(null);
        }
    }

    useEffect(() => {
        async function verifyAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error(
                    lang === 'ar' ? "يرجى تسجيل الدخول لعرض طلباتك." : "Please sign in to view your orders.",
                    {
                        style: { border: '1px solid #F59E0B', padding: '16px', color: '#B45309', fontWeight: 'bold' }
                    }
                );
                router.push("/login");
            } else {
                setUserId(user.id);
                setIsCheckingSession(false);
                fetchUserOrders(user.id);
            }
        }
        verifyAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, lang]);

    // Realtime subscription for live order status updates (Feature 1)
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`customer-orders-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${userId}`
                },
                () => {
                    fetchUserOrders(userId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    async function fetchUserOrders(uid: string) {
        setIsLoadingOrders(true);
        try {
            const { data, error } = await supabase
                .from("orders")
                .select(`
                    id,
                    total_price,
                    status,
                    created_at,
                    order_items (
                        id,
                        quantity,
                        price_at_time,
                        product_id,
                        products (
                            name,
                            image_url
                        )
                    )
                `)
                .eq("user_id", uid)
                .order("created_at", { ascending: false });

            if (error) {
                toast.error((lang === 'ar' ? "خطأ في تحميل الطلبات: " : "Error loading orders: ") + error.message);
            } else if (data) {
                const formattedOrders = (data as unknown as Order[]).map(o => ({
                    ...o,
                    order_items: o.order_items || []
                }));
                setOrders(formattedOrders);
            }
        } catch (err) {
            console.error("Fetch orders error:", err);
            const errMsg = err instanceof Error ? err.message : (lang === 'ar' ? "خطأ في تحميل الطلبات" : "Error loading orders");
            toast.error(errMsg);
        } finally {
            setIsLoadingOrders(false);
        }
    }

    function toggleExpandOrder(orderId: string) {
        setExpandedOrderId(prev => (prev === orderId ? null : orderId));
    }

    async function handleReorder(order: Order) {
        if (!userId) return;
        setIsReorderingMap(prev => ({ ...prev, [order.id]: true }));

        try {
            await new Promise(resolve => setTimeout(resolve, 600));

            let addedCount = 0;
            const metaStr = localStorage.getItem(`biteflow-order-meta-${order.id}`);
            const metaData: OrderDeliveryMeta | null = metaStr ? JSON.parse(metaStr) : null;

            if (metaData && metaData.items) {
                metaData.items.forEach((metaItem: MetaItem) => {
                    addItem({
                        id: metaItem.id,
                        name: metaItem.name,
                        price: metaItem.price,
                        quantity: metaItem.quantity,
                        customization: metaItem.customization
                    });
                    addedCount++;
                });
            } else {
                order.order_items.forEach((item) => {
                    if (item.products) {
                        addItem({
                            id: item.product_id,
                            name: item.products.name,
                            price: item.price_at_time,
                            quantity: item.quantity
                        });
                        addedCount++;
                    }
                });
            }

            if (addedCount > 0) {
                toast.success(
                    lang === 'ar'
                        ? `تمت إضافة ${addedCount} وجبة بنجاح إلى سلتك!`
                        : `Added ${addedCount} customized item(s) back to your cart!`,
                    { style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' } }
                );
                openCart();
            } else {
                toast.error(lang === 'ar' ? "لم يتم العثور على أطباق صالحة لإعادة الطلب." : "No valid products found to re-order.");
            }
        } catch {
            toast.error(lang === 'ar' ? "فشل في إعادة طلب الوجبات." : "Failed to re-order items.");
        } finally {
            setIsReorderingMap(prev => ({ ...prev, [order.id]: false }));
        }
    }

    function getStatusBadgeClass(status: string) {
        switch (status) {
            case "pending": return "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 font-bold";
            case "preparing": return "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/40 text-yellow-700 dark:text-yellow-400 font-bold";
            case "ready": return "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 text-green-700 dark:text-green-400 font-bold animate-pulse";
            case "delivering": return "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 font-bold animate-pulse";
            case "delivered": return "bg-green-500 text-white font-extrabold shadow-sm shadow-green-500/10";
            case "cancelled": return "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 font-bold";
            default: return "bg-gray-100 dark:bg-[#1a1a24] border border-gray-200 dark:border-[#22222e] text-gray-500 dark:text-gray-400 font-bold";
        }
    }

    function getStatusStepLabel(status: string) {
        switch (status) {
            case "pending": return lang === 'ar' ? "تم استلام الطلب" : "Order Received";
            case "preparing": return lang === 'ar' ? "في المطبخ" : "In the Kitchen";
            case "ready": return lang === 'ar' ? "جاهز للاستلام" : "Ready for Pickup";
            case "delivering": return lang === 'ar' ? "في الطريق" : "On the Way";
            case "delivered": return lang === 'ar' ? "تم التوصيل بنجاح" : "Delivered & Arrived";
            case "cancelled": return lang === 'ar' ? "تم الإلغاء" : "Cancelled";
            default: return status;
        }
    }

    function getStatusStepIcon(status: string) {
        switch (status) {
            case "pending": return CheckCircle2;
            case "preparing": return Utensils;
            case "ready": return Sparkles;
            case "delivering": return Truck;
            case "delivered": return MapPin;
            default: return ShoppingBag;
        }
    }

    if (isCheckingSession) {
        return (
            <div className="min-h-[80vh] flex flex-col justify-center items-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                    {lang === 'ar' ? "جاري التحقق من الجلسة..." : "Checking Auth Sessions..."}
                </p>
            </div>
        );
    }

    const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
    const pastOrders = orders.filter(o => o.status === "delivered" || o.status === "cancelled");

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-100/40 dark:bg-orange-950/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-red-100/40 dark:bg-red-950/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-[#22222e] pb-5 relative z-10">
                <div className="space-y-1 text-left">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
                        <ShoppingBag className="w-8 h-8 text-orange-500" />
                        {t.ordersTitle}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t.ordersSubtitle}
                    </p>
                </div>
                <button
                    onClick={() => fetchUserOrders(userId || "")}
                    disabled={isLoadingOrders}
                    className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-[#1a1a24] hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-500 border border-gray-200/60 dark:border-[#22222e] text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                    {t.btnRefreshList}
                </button>
            </div>

            {/* Page Loader */}
            {isLoadingOrders && orders.length === 0 ? (
                <div className="min-h-[40vh] flex flex-col justify-center items-center space-y-3">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 dark:text-gray-500 text-sm font-semibold animate-pulse">
                        {lang === 'ar' ? "جاري تحميل الطلبات..." : "Loading orders..."}
                    </p>
                </div>
            ) : orders.length === 0 ? (
                /* Empty state */
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-white/60 dark:bg-[#121216]/65 backdrop-blur-xl border border-gray-100 dark:border-[#22222e] rounded-3xl space-y-5">
                    <div className="p-5 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-full scale-110">
                        <ShoppingBag className="w-12 h-12" />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">{t.ordersEmptyTitle}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm leading-relaxed">
                            {t.ordersEmptyDesc}
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center gap-2 cursor-pointer text-sm"
                    >
                        {t.ordersBtnOrderFood}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-8 relative z-10">
                    
                    {/* --- Active Order Trackers --- */}
                    {activeOrders.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-extrabold text-orange-600 dark:text-orange-450 uppercase tracking-widest text-left pl-1">
                                {t.ordersActive} ({activeOrders.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {activeOrders.map((order) => {
                                    const StepIcon = getStatusStepIcon(order.status);
                                    const orderRef = `BF-${order.id.substring(0, 5).toUpperCase()}`;
                                    
                                    return (
                                        <div 
                                            key={order.id} 
                                            className="bg-white/90 dark:bg-[#121216]/90 backdrop-blur-md border border-orange-100 dark:border-[#22222e]/60 p-6 rounded-3xl hover:shadow-lg transition-all space-y-4 text-left flex flex-col justify-between"
                                        >
                                            <div className="space-y-3.5">
                                                {/* Header Row */}
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{t.ordersRef}: {orderRef}</span>
                                                    <span className={`text-[10px] uppercase py-1 px-2.5 rounded-full tracking-wider ${getStatusBadgeClass(order.status)}`}>
                                                        {getStatusStepLabel(order.status)}
                                                    </span>
                                                </div>

                                                {/* Info row */}
                                                <div className="flex items-start gap-3">
                                                    <div className="p-3 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-2xl ring-4 ring-orange-50/50 dark:ring-orange-950/15 mt-0.5 animate-pulse">
                                                        <StepIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-extrabold text-gray-900 dark:text-gray-100 text-base leading-snug text-left">
                                                            {getStatusStepLabel(order.status)}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 text-left">
                                                            {lang === 'ar' ? "الإجمالي:" : "Total:"} <span className="font-extrabold text-gray-850 text-gray-800 dark:text-gray-200">${order.total_price.toFixed(2)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Track button */}
                                            <Link
                                                href={`/order-success?orderId=${order.id}`}
                                                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase tracking-wide mt-2"
                                            >
                                                {lang === 'ar' ? "تتبع التوصيل المباشر" : "Track Live Delivery"}
                                                <ArrowRight className="w-3.5 h-3.5 animate-bounce-horizontal" />
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- Order History (Collapsible Accordions) --- */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-extrabold text-gray-500 dark:text-gray-450 uppercase tracking-widest text-left pl-1">
                            {t.ordersPast} ({pastOrders.length})
                        </h3>
                        <div className="divide-y divide-gray-100 dark:divide-[#22222e]/50 bg-white dark:bg-[#121216]/95 border border-gray-100 dark:border-[#22222e] rounded-3xl overflow-hidden shadow-sm">
                            {pastOrders.map((order) => {
                                const isExpanded = expandedOrderId === order.id;
                                const orderRef = `BF-${order.id.substring(0, 5).toUpperCase()}`;
                                const dateFormatted = new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                });
                                const isReordering = isReorderingMap[order.id] || false;

                                return (
                                    <div key={order.id} className="transition-colors hover:bg-gray-50/30 dark:hover:bg-[#1c1c27]/20">
                                        {/* Accordion Trigger Header */}
                                        <div 
                                            onClick={() => toggleExpandOrder(order.id)}
                                            className="w-full px-6 py-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none text-left"
                                        >
                                            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                                                {/* Date */}
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                                                    <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-550" />
                                                    {dateFormatted}
                                                </div>

                                                {/* Ref tag */}
                                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#1a1a24] px-2 py-0.5 rounded-md">
                                                    {orderRef}
                                                </span>

                                                {/* Total Price */}
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                                                    {t.ordersTotalPaid}: <span className="font-extrabold text-orange-500">${order.total_price.toFixed(2)}</span>
                                                </span>
                                            </div>

                                            {/* Status Pill, Quick Reorder & Expand Caret */}
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] uppercase py-0.5 px-2.5 rounded-full tracking-wider font-extrabold ${getStatusBadgeClass(order.status)}`}>
                                                    {getStatusStepLabel(order.status)}
                                                </span>
                                                {order.status === 'delivered' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReorder(order);
                                                        }}
                                                        disabled={isReordering}
                                                        className="text-[10px] uppercase py-0.5 px-2.5 rounded-full tracking-wider font-extrabold bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/40 hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <RefreshCw className={`w-2.5 h-2.5 ${isReordering ? 'animate-spin' : ''}`} />
                                                        {t.ordersQuickReorder}
                                                    </button>
                                                )}
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                                            </div>
                                        </div>

                                        {/* Expanded Details Body */}
                                        {isExpanded && (
                                            <div className="px-6 pb-6 pt-2 border-t border-gray-50/50 dark:border-[#22222e]/40 bg-gray-50/30 dark:bg-[#1a1a24]/10 space-y-5 animate-fadeIn">
                                                <div className="max-w-2xl mx-auto w-full space-y-5">
                                                    {/* Items summary */}
                                                    <div className="space-y-2.5 text-left">
                                                        <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-0.5">{t.ordersReceiptsHeader}</h5>
                                                        <div className="bg-white dark:bg-[#121216] rounded-2xl border border-gray-100 dark:border-[#22222e] p-4 divide-y divide-gray-50 dark:divide-[#22222e]/30 shadow-sm text-left">
                                                        {(() => {
                                                            let metaData: OrderDeliveryMeta | null = null;
                                                            if (typeof window !== "undefined") {
                                                                const metaStr = localStorage.getItem(`biteflow-order-meta-${order.id}`);
                                                                if (metaStr) {
                                                                    metaData = JSON.parse(metaStr);
                                                                }
                                                            }

                                                            if (metaData && metaData.items && metaData.items.length > 0) {
                                                                return metaData.items.map((metaItem: MetaItem, idx: number) => (
                                                                    <div key={idx} className="flex justify-between items-start py-2.5 first:pt-0 last:pb-0 gap-4">
                                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                                            <div className="space-y-0.5 min-w-0 text-left">
                                                                                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block truncate">
                                                                                    {translateMenu(metaItem.name, lang)}
                                                                                </span>
                                                                                {metaItem.customization && (
                                                                                    <div className="text-[10px] text-gray-400 dark:text-gray-550 font-semibold space-y-0.5 mt-0.5 pl-1.5 border-l border-orange-500/30 text-left">
                                                                                        {metaItem.customization.size && (
                                                                                            <p className="leading-tight">
                                                                                                {lang === 'ar' ? "الحجم:" : "Portion:"} <span className="text-gray-600 dark:text-gray-300 font-bold">{translateAddon(metaItem.customization.size, lang)}</span>
                                                                                            </p>
                                                                                        )}
                                                                                        {(metaItem.customization.addons && metaItem.customization.addons.length > 0) && (
                                                                                            <p className="leading-tight">
                                                                                                {lang === 'ar' ? "الإضافات:" : "Toppings:"} <span className="text-orange-500 dark:text-orange-450">{metaItem.customization.addons.map(add => translateAddon(add, lang)).join(", ")}</span>
                                                                                            </p>
                                                                                        )}
                                                                                        {metaItem.customization.instructions && (
                                                                                            <p className="italic text-gray-400 dark:text-gray-500 font-normal leading-tight">
                                                                                                {lang === 'ar' ? "ملاحظة:" : "Note:"} &quot;{metaItem.customization.instructions}&quot;
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                                                    {lang === 'ar' ? "الكمية:" : "Qty:"} {metaItem.quantity} @ ${metaItem.price.toFixed(2)}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 shrink-0">${(metaItem.price * metaItem.quantity).toFixed(2)}</span>
                                                                    </div>
                                                                ));
                                                            }

                                                            if (order.order_items && order.order_items.length > 0) {
                                                                return order.order_items.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0 gap-4">
                                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                            {item.products?.image_url && (
                                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                                <img 
                                                                                    src={item.products.image_url} 
                                                                                    alt={item.products.name}
                                                                                    className="w-10 h-10 object-cover rounded-lg border border-gray-100 dark:border-[#22222e]/60 bg-gray-50 dark:bg-[#1a1a24] shrink-0"
                                                                                />
                                                                            )}
                                                                            <div className="space-y-0.5 min-w-0 text-left">
                                                                                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block truncate">{item.products ? translateMenu(item.products.name, lang) : (lang === 'ar' ? "طبق محذوف" : "Deleted Dish")}</span>
                                                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                                                    {lang === 'ar' ? "الكمية:" : "Qty:"} {item.quantity} @ ${item.price_at_time.toFixed(2)}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 shrink-0">${(item.price_at_time * item.quantity).toFixed(2)}</span>
                                                                    </div>
                                                                ));
                                                            }

                                                            return (
                                                                <div className="py-6 px-4 text-center space-y-3">
                                                                    <div className="p-3 bg-orange-50 dark:bg-orange-950/30 text-orange-500 dark:text-orange-400 rounded-full inline-block">
                                                                        <ShoppingBag className="w-6 h-6" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-sm font-extrabold text-gray-800 dark:text-gray-100">
                                                                            {lang === 'ar' ? "تفاصيل الفاتورة غير متاحة" : "Receipt Details Unavailable"}
                                                                        </p>
                                                                        <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto leading-relaxed">
                                                                            {lang === 'ar'
                                                                                ? "تم إجراء هذا الطلب من جهاز/جلسة أخرى، أو تم مسح ذاكرة التخزين المحلية لمتصفحك."
                                                                                : "This order was placed on another device/session, or your local browser metadata has been cleared."
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <div className="pt-2">
                                                                        <span className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-xl text-xs font-bold">
                                                                            {t.ordersTotalPaid}: ${order.total_price.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Re-order & Track detail Row */}
                                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                                    <button
                                                        onClick={() => handleReorder(order)}
                                                        disabled={isReordering}
                                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50"
                                                    >
                                                        {isReordering ? (
                                                            <>
                                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                {t.ordersBtnReordering}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <RefreshCw className="w-3.5 h-3.5" />
                                                                {t.ordersBtnReorder}
                                                            </>
                                                        )}
                                                    </button>
                                                    
                                                    <Link
                                                        href={`/order-success?orderId=${order.id}`}
                                                        className="bg-gray-100 dark:bg-[#1a1a24] hover:bg-gray-200 dark:hover:bg-[#232333] text-gray-700 dark:text-gray-300 font-bold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs border border-gray-200/50 dark:border-[#22222e]/80"
                                                    >
                                                        {t.ordersBtnViewSummary}
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </Link>

                                                    <button
                                                        onClick={() => setConfirmDeleteId(order.id)}
                                                        disabled={isDeletingMap[order.id]}
                                                        className="bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs border border-red-100/50 dark:border-red-950/40 disabled:opacity-50"
                                                    >
                                                        {isDeletingMap[order.id] ? (
                                                            <>
                                                                <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                                                {t.delModalRemoving}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                {t.ordersBtnRemoveOrder}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}

            {/* Premium Confirm Deletion Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-[#121216] rounded-3xl max-w-sm w-full p-6 border border-gray-100 dark:border-[#22222e] shadow-2xl relative space-y-6 text-center animate-scaleUp">
                        {/* Red warning icon */}
                        <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center ring-4 ring-red-50/50 dark:ring-red-950/20">
                            <Trash2 className="w-8 h-8" />
                        </div>

                        {/* Title and Description */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
                                {t.delModalTitle}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                                {lang === 'ar' ? (
                                    <>سيؤدي هذا إلى حذف الطلب <span className="font-extrabold text-gray-700 dark:text-gray-300">BF-{confirmDeleteId.substring(0, 5).toUpperCase()}</span> نهائياً من سجلات لوحة التحكم الخاصة بك. لا يمكن التراجع عن هذا الإجراء.</>
                                ) : (
                                    <>This will permanently remove order <span className="font-extrabold text-gray-700 dark:text-gray-300">BF-{confirmDeleteId.substring(0, 5).toUpperCase()}</span> from your dashboard records. This action cannot be undone.</>
                                )}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 bg-gray-100 dark:bg-[#1a1a24] hover:bg-gray-200 dark:hover:bg-[#232333] text-gray-700 dark:text-gray-300 font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wide border border-gray-200/50 dark:border-[#22222e]/80"
                            >
                                {t.delModalBtnCancel}
                            </button>
                            <button
                                onClick={() => handleDeleteOrder(confirmDeleteId)}
                                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs uppercase tracking-wide flex items-center justify-center gap-1.5"
                            >
                                {isDeletingMap[confirmDeleteId] ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {t.delModalRemoving}
                                    </>
                                ) : (
                                    t.delModalBtnConfirm
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
