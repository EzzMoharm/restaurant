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

interface OrderMeta {
    fullName: string;
    address: string;
    city: string;
    phoneNumber: string;
    paymentMethod: string;
    items: {
        id: string;
        name: string;
        price: number;
        quantity: number;
    }[];
    discountAmount: number;
    grandTotal: number;
    createdAt: string;
}

export default function OrderSuccessPage() {
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
                // Fetch from Supabase with order items relation
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
                        setDbOrderItems(data.order_items);
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

        // 2. Poll for status updates every 5 seconds
        const interval = setInterval(async () => {
            const { data, error } = await supabase
                .from("orders")
                .select("status")
                .eq("id", orderId)
                .single();

            if (!error && data) {
                if (data.status !== orderStatus) {
                    setOrderStatus(data.status);
                    toast.success(`Order status: ${getStatusLabel(data.status)}`, {
                        style: {
                            border: '1px solid #F59E0B',
                            padding: '12px',
                            color: '#78350F',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }
                    });
                }
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [orderId, orderStatus]);

    function getStatusLabel(status: string) {
        switch (status) {
            case "pending": return "Order Received";
            case "preparing": return "Preparing in Kitchen";
            case "ready": return "Ready for Pickup / Delivery";
            case "delivering": return "Out for Delivery";
            case "delivered": return "Delivered & Arrived";
            case "cancelled": return "Cancelled";
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
                <p className="text-gray-500 font-medium animate-pulse">Locating Live Order Tracker...</p>
            </div>
        );
    }

    const currentStep = getStatusStep(orderStatus);
    const orderRef = orderId ? `BF-${orderId.substring(0, 5).toUpperCase()}` : "BF-MOCK";

    const steps = [
        { label: "Received", desc: "Chef approved", icon: CheckCircle2 },
        { label: "Cooking", desc: "In the kitchen", icon: Utensils },
        { label: "Ready", desc: "Quality packed", icon: Sparkles },
        { label: "On the Way", desc: "Out for delivery", icon: Truck },
        { label: "Arrived", desc: "Delivered safely", icon: MapPin }
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

            {/* Title / Back Shortcut */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {orderStatus === "cancelled" ? "Order Cancelled" : "Live Order Tracker"}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">
                        Reference: <span className="font-extrabold text-gray-800 tracking-wide">{orderRef}</span>
                        {orderMeta?.createdAt && ` • Placed at ${new Date(orderMeta.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                </div>
                <div className="flex gap-2.5">
                    <Link
                        href="/orders"
                        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-orange-500 hover:text-white text-gray-100 px-4 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-sm"
                    >
                        View Order History
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 bg-orange-50 hover:bg-orange-100/80 text-orange-600 px-4 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer border border-orange-200/50"
                    >
                        Back to Menu
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                
                {/* Left Column: Progress Stepper */}
                <div className="lg:col-span-7 space-y-6">
                    {orderStatus === "cancelled" ? (
                        <div className="bg-red-50/80 border border-red-100 p-8 rounded-3xl text-center space-y-4">
                            <div className="inline-flex p-4 bg-red-100 text-red-600 rounded-full scale-110">
                                <XCircle className="w-12 h-12" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-extrabold text-red-950">This order has been cancelled</h3>
                                <p className="text-sm text-red-700/80 max-w-md mx-auto leading-relaxed">
                                    We are sorry, but your order has been cancelled by the kitchen team. If payment was made, your refund has been processed.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8 relative">
                            {/* Live Sync pulsing tag */}
                            <div className="absolute top-6 right-6 inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider animate-pulse border border-orange-100">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                Live Polling
                            </div>

                            <div className="space-y-1 text-left">
                                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Fulfillment Stage</span>
                                <h2 className="text-xl font-extrabold text-gray-900">
                                    {getStatusLabel(orderStatus)}
                                </h2>
                            </div>

                            {/* Stepper Timeline */}
                            <div className="relative pl-1 space-y-8">
                                {/* Connecting line */}
                                <div className="absolute top-3 bottom-3 left-6 sm:left-7 w-0.5 bg-gray-100 -z-1">
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
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all scale-110 ring-4 ring-orange-100 animate-pulse">
                                                        <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 text-gray-400 border border-gray-200 rounded-full flex items-center justify-center transition-all scale-95">
                                                        <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Step Text Info */}
                                            <div className="space-y-0.5 pt-1.5 text-left">
                                                <h4 className={`text-sm sm:text-base font-extrabold ${isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {step.label}
                                                </h4>
                                                <p className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    {step.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Delivery ETA Alert */}
                            {currentStep >= 0 && currentStep < 4 && (
                                <div className="bg-orange-50/50 border border-orange-100/50 p-4 rounded-2xl flex items-start gap-3 text-sm text-left">
                                    <div className="p-2 bg-orange-100 text-orange-600 rounded-xl mt-0.5 shrink-0">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-orange-950">Estimated Preparation & Transit</h4>
                                        <p className="text-xs text-orange-800/80 leading-relaxed mt-0.5">
                                            Delicious dishes are estimated to reach your dining table within **25 - 35 minutes**. Feel free to refresh this tracker to watch kitchen progress in real-time.
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
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-left">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-3 border-gray-50">
                            <MapPin className="w-5 h-5 text-orange-500" />
                            Delivery Details
                        </h3>
                        
                        <div className="space-y-3.5 text-sm font-medium">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Recipient Name</span>
                                <span className="text-gray-800">{orderMeta?.fullName || "Guest Customer"}</span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Delivery Destination</span>
                                <span className="text-gray-800 text-xs">
                                    {orderMeta?.address ? `${orderMeta.address}, ${orderMeta.city}` : "Stored securely on checkout device"}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Phone Line</span>
                                    <span className="text-gray-850 text-gray-700 flex items-center gap-1.5 text-xs italic">
                                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        {orderMeta?.phoneNumber || "Stored locally"}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Payment</span>
                                    <span className="text-gray-850 text-gray-700 flex items-center gap-1.5 uppercase font-semibold text-xs italic">
                                        <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        {orderMeta?.paymentMethod || "Stored locally"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Items Details */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 text-left">
                        <button 
                            onClick={() => setIsReceiptOpen(!isReceiptOpen)}
                            className="w-full flex items-center justify-between font-bold text-gray-900 border-b pb-3 border-gray-50 cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-orange-500" />
                                Itemized Receipt
                            </span>
                            {isReceiptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isReceiptOpen && (
                            <div className="space-y-4">
                                {/* Items list */}
                                <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto pr-1">
                                    {orderMeta?.items && orderMeta.items.length > 0 ? (
                                        orderMeta.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                                                <div className="space-y-0.5">
                                                    <span className="font-semibold text-sm text-gray-900">{item.name}</span>
                                                    <p className="text-xs text-gray-400">Qty: {item.quantity} @ ${item.price.toFixed(2)}</p>
                                                </div>
                                                <span className="font-bold text-sm text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))
                                    ) : dbOrderItems && dbOrderItems.length > 0 ? (
                                        dbOrderItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                                                <div className="space-y-0.5">
                                                    <span className="font-semibold text-sm text-gray-900">{item.products?.name || "Deleted Dish"}</span>
                                                    <p className="text-xs text-gray-400">Qty: {item.quantity} @ ${item.price_at_time.toFixed(2)}</p>
                                                </div>
                                                <span className="font-bold text-sm text-gray-900">${(item.price_at_time * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 px-4 text-center space-y-3">
                                            <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-extrabold text-gray-800">Receipt Details Unavailable</p>
                                                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                                                    This order was placed on another device/session, or your local browser metadata has been cleared.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Calculation details */}
                                <div className="border-t border-gray-50 pt-3 space-y-2 text-sm">
                                    <div className="flex justify-between text-gray-500 font-medium">
                                        <span>Subtotal</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600 font-bold">
                                            <span>Promo Discount</span>
                                            <span>-${discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-500 font-medium">
                                        <span>Delivery & Package Fee</span>
                                        <span>$3.99</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500 font-medium">
                                        <span>Tax & Service (8%)</span>
                                        <span>${(subtotal * 0.08).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-50 pt-3 text-base font-extrabold text-gray-900">
                                        <span>Total Paid</span>
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
