// app/order-success/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
    CheckCircle2, Clock, MapPin, ArrowRight, Sparkles, 
    Utensils, Truck, Check, Receipt, RefreshCw, XCircle, ChevronDown, ChevronUp, Phone, CreditCard, ShoppingBag
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { useTranslation, translateMenu } from "@/lib/translations";

interface ProductData {
    name: string;
    image_url: string;
}

interface OrderItem {
    id: string;
    quantity: number;
    price_at_time: number;
    product_id: string;
    products: ProductData | null;
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

interface OrderMeta {
    fullName: string;
    address: string;
    city: string;
    phoneNumber: string;
    paymentMethod: string;
    items: MetaItem[];
    discountAmount: number;
    grandTotal: number;
    createdAt: string;
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

export default function OrderSuccessPage() {
    const { t, lang } = useTranslation();
    const [orderId, setOrderId] = useState<string | null>(null);
    const [orderStatus, setOrderStatus] = useState<string>("pending");
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [orderMeta, setOrderMeta] = useState<OrderMeta | null>(null);
    const [dbOrderItems, setDbOrderItems] = useState<OrderItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(true);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("orderId");
        setTimeout(() => {
            setOrderId(id);
        }, 0);
    }, []);

    useEffect(() => {
        if (!orderId) {
            setTimeout(() => {
                setIsLoading(false);
            }, 0);
            return;
        }

        // 1. Initial fetch from database and localStorage
        async function fetchOrderDetails() {
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
                    .eq("id", orderId)
                    .single();

                if (!error && data) {
                    setOrderStatus(data.status);
                    setTotalPrice(data.total_price);
                    if (data.order_items) {
                        const mappedItems = data.order_items.map((item: { id: string; quantity: number; price_at_time: number; product_id: string; products: { name: string; image_url: string } | { name: string; image_url: string }[] | null }) => {
                            let productObj = null;
                            if (item.products) {
                                if (Array.isArray(item.products)) {
                                    productObj = item.products[0] || null;
                                } else {
                                    productObj = item.products;
                                }
                            }
                            return {
                                id: item.id,
                                quantity: item.quantity,
                                price_at_time: item.price_at_time,
                                product_id: item.product_id,
                                products: productObj
                            };
                        });
                        setDbOrderItems(mappedItems);
                    }
                }

                // Fetch from LocalStorage
                const metaStr = localStorage.getItem(`biteflow-order-meta-${orderId}`);
                if (metaStr) {
                    setOrderMeta(JSON.parse(metaStr));
                }
            } catch (err) {
                console.error("Error fetching order details:", err);
            } finally {
                setTimeout(() => {
                    setIsLoading(false);
                }, 0);
            }
        }

        fetchOrderDetails();

        // 2. Real-time subscription for instant status updates
        const channel = supabase
            .channel(`order-track-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`
                },
                (payload) => {
                    const newStatus = (payload.new as { status: string }).status;
                    if (newStatus && newStatus !== orderStatus) {
                        setOrderStatus(newStatus);
                        toast.success(
                            lang === 'ar'
                                ? `حالة الطلب الحالية: ${getStatusLabel(newStatus)}`
                                : `Order status: ${getStatusLabel(newStatus)}`,
                            {
                                style: {
                                    border: '1px solid #F59E0B',
                                    padding: '12px',
                                    color: '#78350F',
                                    fontWeight: 'bold',
                                    fontSize: '14px'
                                }
                            }
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, orderStatus, lang]);

    function getStatusLabel(status: string) {
        switch (status) {
            case "pending": return lang === 'ar' ? "تم استلام الطلب" : "Order Received";
            case "preparing": return lang === 'ar' ? "تحضير الطعام في المطبخ" : "Preparing in Kitchen";
            case "ready": return lang === 'ar' ? "جاهز للاستلام / التوصيل" : "Ready for Pickup / Delivery";
            case "delivering": return lang === 'ar' ? "خارج للتوصيل" : "Out for Delivery";
            case "delivered": return lang === 'ar' ? "تم التوصيل بنجاح" : "Delivered & Arrived";
            case "cancelled": return lang === 'ar' ? "تم الإلغاء" : "Cancelled";
            default: return status;
        }
    }

    function getStatusStep(status: string): number {
        switch (status) {
            case "pending": return 0;
            case "preparing": return 1;
            case "ready": return 2;
            case "delivering": return 3;
            case "delivered": return 4;
            case "cancelled": return -1;
            default: return 0;
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-[80vh] flex flex-col justify-center items-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                    {lang === 'ar' ? "تحديد موقع تتبع الطلب المباشر..." : "Locating Live Order Tracker..."}
                </p>
            </div>
        );
    }

    const currentStep = getStatusStep(orderStatus);
    const orderRef = orderId ? `BF-${orderId.substring(0, 5).toUpperCase()}` : "BF-MOCK";

    const steps = [
        { label: t.successStepReceived, desc: t.successStepReceivedDesc, icon: CheckCircle2 },
        { label: t.successStepCooking, desc: t.successStepCookingDesc, icon: Utensils },
        { label: t.successStepReady, desc: t.successStepReadyDesc, icon: Sparkles },
        { label: t.successStepWay, desc: t.successStepWayDesc, icon: Truck },
        { label: t.successStepArrived, desc: t.successStepArrivedDesc, icon: MapPin }
    ];

    // Subtotals Calculations
    const finalTotal = orderMeta?.grandTotal || totalPrice || 0.00;
    const subtotal = orderMeta?.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        || dbOrderItems.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0)
        || (finalTotal > 3.99 ? finalTotal - 3.99 : finalTotal);
    const discount = orderMeta?.discountAmount || 0.00;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 relative overflow-hidden">
            {/* Celebration Sparkles overlay */}
            {orderStatus === "delivered" && (
                <div className="absolute inset-0 pointer-events-none z-0 opacity-10 animate-pulse bg-gradient-to-br from-green-500/20 via-transparent to-green-500/20 rounded-3xl blur-3xl"></div>
            )}

            {/* Ambient background glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-100/40 dark:bg-orange-950/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-red-100/40 dark:bg-red-950/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            {/* Title / Back Shortcut */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-[#22222e] pb-5 relative z-10">
                <div className="space-y-1 text-left">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                        {orderStatus === "cancelled" ? t.successCancelled : t.successTitle}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {t.successRef}: <span className="font-extrabold text-gray-800 dark:text-gray-200 tracking-wide">{orderRef}</span>
                        {orderMeta?.createdAt && ` • ${t.successPlacedAt} ${new Date(orderMeta.createdAt).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                </div>
                <div className="flex gap-2.5">
                    <Link
                        href="/orders"
                        className="inline-flex items-center gap-2 bg-gray-900 dark:bg-orange-600 hover:bg-orange-500 dark:hover:bg-orange-500 text-gray-100 dark:text-white px-4 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-sm"
                    >
                        {t.btnViewOrderHistory}
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100/80 text-orange-600 dark:text-orange-400 px-4 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer border border-orange-200/50 dark:border-orange-900/40"
                    >
                        {t.btnBackMenu}
                        <ArrowRight className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                    </Link>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                
                {/* Left Column: Progress Stepper */}
                <div className="lg:col-span-7 space-y-6">
                    {orderStatus === "cancelled" ? (
                        <div className="bg-red-50/80 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 p-8 rounded-3xl text-center space-y-4">
                            <div className="inline-flex p-4 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full scale-110">
                                <XCircle className="w-12 h-12" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-extrabold text-red-950 dark:text-red-200">
                                    {lang === 'ar' ? "تم إلغاء هذا الطلب" : "This order has been cancelled"}
                                </h3>
                                <p className="text-sm text-red-700/80 dark:text-red-400/80 max-w-md mx-auto leading-relaxed">
                                    {lang === 'ar' 
                                        ? "معذرة، ولكن تم إلغاء طلبك من قبل فريق المطبخ. إذا تم الدفع، فقد تم معالجة استرداد أموالك." 
                                        : "We are sorry, but your order has been cancelled by the kitchen team. If payment was made, your refund has been processed."
                                    }
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#121216]/90 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-[#22222e] shadow-sm space-y-8 relative">
                            {/* Live Sync pulsing tag */}
                            <div className="absolute top-6 right-6 inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider animate-pulse border border-orange-100 dark:border-orange-900/40">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                {lang === 'ar' ? "تحديث فوري" : "Live Sync"}
                            </div>

                            <div className="space-y-1 text-left">
                                <span className="text-xs font-bold text-orange-500 dark:text-orange-450 uppercase tracking-widest">
                                    {lang === 'ar' ? "مرحلة تلبية الطلب" : "Fulfillment Stage"}
                                </span>
                                <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                                    {getStatusLabel(orderStatus)}
                                </h2>
                            </div>

                            {/* Stepper Timeline */}
                            <div className="relative pl-1 space-y-8">
                                {/* Connecting line */}
                                <div className="absolute top-3 bottom-3 left-6 sm:left-7 w-0.5 bg-gray-100 dark:bg-[#22222e] -z-1">
                                    {/* Active filled line */}
                                    <div 
                                        className="w-full bg-gradient-to-b from-green-500 to-orange-500 transition-all duration-1000 ease-in-out" 
                                        style={{ height: `${Math.max(0, currentStep) * 25}%` }}
                                    />
                                </div>

                                {steps.map((step, idx) => {
                                    const StepIcon = step.icon;
                                    const isCompleted = idx < currentStep;
                                    const isActive = idx === currentStep;

                                    return (
                                        <div key={idx} className="flex items-start gap-4 sm:gap-6 relative">
                                            {/* Step Circle */}
                                            <div className="relative shrink-0 z-10">
                                                {isCompleted ? (
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md shadow-green-500/20 transition-all scale-100">
                                                        <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3px]" />
                                                    </div>
                                                ) : isActive ? (
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all scale-110 ring-4 ring-orange-100 dark:ring-orange-950/40 animate-pulse">
                                                        <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 dark:bg-[#1a1a24] text-gray-400 border border-gray-200 dark:border-[#22222e] rounded-full flex items-center justify-center transition-all scale-95">
                                                        <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Step Text Info */}
                                            <div className="space-y-0.5 pt-1.5 text-left">
                                                <h4 className={`text-sm sm:text-base font-extrabold ${isActive ? 'text-orange-600 dark:text-orange-400' : isCompleted ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                                                    {step.label}
                                                </h4>
                                                <p className={`text-xs ${isActive ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                                    {step.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Delivery ETA Alert */}
                            {currentStep >= 0 && currentStep < 4 && (
                                <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100/50 dark:border-[#22222e]/40 p-4 rounded-2xl flex items-start gap-3 text-sm text-left">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-xl mt-0.5 shrink-0">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-orange-950 dark:text-orange-200">{t.successEtaTitle}</h4>
                                        <p className="text-xs text-orange-850/80 dark:text-orange-400/80 leading-relaxed mt-0.5">
                                            {t.successEtaDesc}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Receipt Breakdown & Delivery Details */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Delivery Address Receipt Card */}
                    <div className="bg-white dark:bg-[#121216]/90 p-6 rounded-3xl border border-gray-100 dark:border-[#22222e] shadow-sm space-y-4 text-left">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b pb-3 border-gray-50 dark:border-[#22222e]/40">
                            <MapPin className="w-5 h-5 text-orange-500" />
                            {t.successDeliveryDetails}
                        </h3>
                        
                        <div className="space-y-3.5 text-sm font-medium">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{t.successRecipient}</span>
                                <span className="text-gray-800 dark:text-gray-200">{orderMeta?.fullName || (lang === 'ar' ? "عميل زائر" : "Guest Customer")}</span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-gray-400 dark:text-gray-550 font-bold uppercase tracking-wider">{t.successDestination}</span>
                                <span className="text-gray-800 dark:text-gray-200 text-xs">
                                    {orderMeta?.address ? `${orderMeta.address}, ${orderMeta.city}` : t.successStoredSecurely}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-gray-400 dark:text-gray-550 font-bold uppercase tracking-wider">{t.successPhone}</span>
                                    <span className="text-gray-850 text-gray-700 dark:text-gray-300 flex items-center gap-1.5 text-xs italic">
                                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        {orderMeta?.phoneNumber || t.successStoredLocally}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-gray-400 dark:text-gray-550 font-bold uppercase tracking-wider">{t.successPayment}</span>
                                    <span className="text-gray-850 text-gray-700 dark:text-gray-300 flex items-center gap-1.5 uppercase font-semibold text-xs italic">
                                        <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        {orderMeta?.paymentMethod ? (orderMeta.paymentMethod === 'card' ? t.checkoutPaymentCard : t.checkoutPaymentCod) : t.successStoredLocally}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Items Details */}
                    <div className="bg-white dark:bg-[#121216]/90 p-6 rounded-3xl border border-gray-100 dark:border-[#22222e] shadow-sm space-y-4 text-left">
                        <button 
                            onClick={() => setIsReceiptOpen(!isReceiptOpen)}
                            className="w-full flex items-center justify-between font-bold text-gray-900 dark:text-gray-100 border-b pb-3 border-gray-50 dark:border-[#22222e]/40 cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-orange-500" />
                                {t.successReceiptTitle}
                            </span>
                            {isReceiptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isReceiptOpen && (
                            <div className="space-y-4">
                                {/* Items list */}
                                <div className="divide-y divide-gray-50 dark:divide-[#22222e]/30 max-h-48 overflow-y-auto pr-1">
                                    {orderMeta?.items && orderMeta.items.length > 0 ? (
                                        orderMeta.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start py-2.5 first:pt-0 last:pb-0 gap-4">
                                                <div className="space-y-0.5 text-left">
                                                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block">{translateMenu(item.name, lang)}</span>
                                                    {item.customization && (
                                                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold space-y-0.5 mt-0.5 pl-1.5 border-l border-orange-500/30 text-left">
                                                            {item.customization.size && (
                                                                <p className="leading-tight">
                                                                    {lang === 'ar' ? "الحجم:" : "Portion:"} <span className="text-gray-600 dark:text-gray-300 font-bold">{translateAddon(item.customization.size, lang)}</span>
                                                                </p>
                                                            )}
                                                            {(item.customization.addons && item.customization.addons.length > 0) && (
                                                                <p className="leading-tight">
                                                                    {lang === 'ar' ? "الإضافات:" : "Toppings:"} <span className="text-orange-500 dark:text-orange-450">{item.customization.addons.map(add => translateAddon(add, lang)).join(", ")}</span>
                                                                </p>
                                                            )}
                                                            {item.customization.instructions && (
                                                                <p className="italic text-gray-400 dark:text-gray-550 font-normal leading-tight">
                                                                    {lang === 'ar' ? "ملاحظة:" : "Note:"} &quot;{item.customization.instructions}&quot;
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                    <p className="text-xs text-gray-400 dark:text-gray-505">
                                                        {lang === 'ar' ? "الكمية:" : "Qty:"} {item.quantity} @ ${item.price.toFixed(2)}
                                                    </p>
                                                </div>
                                                <span className="font-bold text-sm text-gray-900 dark:text-gray-200 shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))
                                    ) : dbOrderItems && dbOrderItems.length > 0 ? (
                                        dbOrderItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                                                <div className="space-y-0.5 text-left">
                                                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{item.products ? translateMenu(item.products.name, lang) : (lang === 'ar' ? "طبق محذوف" : "Deleted Dish")}</span>
                                                    <p className="text-xs text-gray-400 dark:text-gray-505">
                                                        {lang === 'ar' ? "الكمية:" : "Qty:"} {item.quantity} @ ${item.price_at_time.toFixed(2)}
                                                    </p>
                                                </div>
                                                <span className="font-bold text-sm text-gray-900 dark:text-gray-200">${(item.price_at_time * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 px-4 text-center space-y-3">
                                            <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-extrabold text-gray-800 dark:text-gray-100">
                                                    {t.successReceiptUnavailable}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto leading-relaxed">
                                                    {lang === 'ar'
                                                        ? "تم إجراء هذا الطلب من جهاز/جلسة أخرى، أو تم مسح ذاكرة التخزين المحلية لمتصفحك."
                                                        : "This order was placed on another device/session, or your local browser metadata has been cleared."
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Calculation details */}
                                <div className="border-t border-gray-50 dark:border-[#22222e]/45 pt-3 space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-500 dark:text-gray-400 font-medium">
                                        <span>{t.cartSubtotal}</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600 dark:text-green-400 font-bold">
                                            <span>{lang === 'ar' ? "خصم الكود" : "Promo Discount"}</span>
                                            <span>-${discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-500 dark:text-gray-400 font-medium">
                                        <span>{lang === 'ar' ? "رسوم التوصيل والتعبئة" : "Delivery & Package Fee"}</span>
                                        <span>$3.99</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500 dark:text-gray-400 font-medium">
                                        <span>{t.cartTax}</span>
                                        <span>${(subtotal * 0.08).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-50 dark:border-[#22222e]/45 pt-3 text-base font-extrabold text-gray-900 dark:text-gray-100">
                                        <span>{t.successTotalPaid}</span>
                                        <span>${finalTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
