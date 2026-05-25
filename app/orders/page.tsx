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

export default function CustomerOrdersPage() {
    const router = useRouter();
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
            // Deleting order will cascade delete order_items if configured,
            // but we can delete from orders directly.
            const { error } = await supabase
                .from("orders")
                .delete()
                .eq("id", orderId);

            if (error) {
                toast.error("Failed to delete order: " + error.message);
            } else {
                toast.success("Order removed from history.", {
                    style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
                });
                setOrders(prev => prev.filter(o => o.id !== orderId));
                localStorage.removeItem(`biteflow-order-meta-${orderId}`);
            }
        } catch (err) {
            console.error("Delete order error:", err);
            toast.error("An unexpected error occurred while deleting the order.");
        } finally {
            setIsDeletingMap(prev => ({ ...prev, [orderId]: false }));
            setConfirmDeleteId(null);
        }
    }

    useEffect(() => {
        async function verifyAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please sign in to view your orders.", {
                    style: { border: '1px solid #F59E0B', padding: '16px', color: '#B45309', fontWeight: 'bold' }
                });
                router.push("/login");
            } else {
                setUserId(user.id);
                setIsCheckingSession(false);
                fetchUserOrders(user.id);
            }
        }
        verifyAuth();
    }, [router]);

    async function fetchUserOrders(uid: string) {
        setIsLoadingOrders(true);
        try {
            // Join query: orders -> order_items -> products
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
                toast.error("Error loading orders: " + error.message);
            } else if (data) {
                // Ensure typings compatibility
                const formattedOrders = (data as unknown as Order[]).map(o => ({
                    ...o,
                    order_items: o.order_items || []
                }));
                setOrders(formattedOrders);
            }
        } catch (err) {
            console.error("Fetch orders error:", err);
            const errMsg = err instanceof Error ? err.message : "Error loading orders";
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
            // Simulate realistic micro-animation feedback
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
                toast.success(`Added ${addedCount} customized item(s) back to your cart!`, {
                    style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
                });
                openCart();
            } else {
                toast.error("No valid products found to re-order.");
            }
        } catch {
            toast.error("Failed to re-order items.");
        } finally {
            setIsReorderingMap(prev => ({ ...prev, [order.id]: false }));
        }
    }

    function getStatusBadgeClass(status: string) {
        switch (status) {
            case "pending": return "bg-orange-50 border border-orange-200 text-orange-600 font-bold";
            case "preparing": return "bg-yellow-50 border border-yellow-200 text-yellow-700 font-bold";
            case "ready": return "bg-green-50 border border-green-200 text-green-700 font-bold animate-pulse";
            case "delivering": return "bg-blue-50 border border-blue-200 text-blue-600 font-bold animate-pulse";
            case "delivered": return "bg-green-500 text-white font-extrabold shadow-sm shadow-green-500/10";
            case "cancelled": return "bg-red-50 border border-red-200 text-red-600 font-bold";
            default: return "bg-gray-100 border border-gray-200 text-gray-500 font-bold";
        }
    }

    function getStatusStepLabel(status: string) {
        switch (status) {
            case "pending": return "Order Received";
            case "preparing": return "In the Kitchen";
            case "ready": return "Ready for Pickup";
            case "delivering": return "On the Way";
            case "delivered": return "Delivered & Arrived";
            case "cancelled": return "Cancelled";
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
                <p className="text-gray-500 font-medium animate-pulse">Checking Auth Sessions...</p>
            </div>
        );
    }

    // Split orders into active vs history lists
    const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
    const pastOrders = orders.filter(o => o.status === "delivered" || o.status === "cancelled");

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-100/40 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-red-100/40 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5 relative z-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        <ShoppingBag className="w-8 h-8 text-orange-500" />
                        My Restaurant Orders
                    </h1>
                    <p className="text-sm text-gray-500">
                        Track live kitchen preparations and review past dining transactions.
                    </p>
                </div>
                <button
                    onClick={() => fetchUserOrders(userId || "")}
                    disabled={isLoadingOrders}
                    className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-orange-50 hover:text-orange-500 border border-gray-200/60 text-gray-600 px-4 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                    Refresh List
                </button>
            </div>

            {/* Page Loader */}
            {isLoadingOrders && orders.length === 0 ? (
                <div className="min-h-[40vh] flex flex-col justify-center items-center space-y-3">
                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm font-semibold animate-pulse">Loading orders...</p>
                </div>
            ) : orders.length === 0 ? (
                /* Empty state */
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-white/60 backdrop-blur-xl border border-gray-100 rounded-3xl space-y-5">
                    <div className="p-5 bg-orange-100 text-orange-600 rounded-full scale-110">
                        <ShoppingBag className="w-12 h-12" />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-xl font-extrabold text-gray-900">No Orders Found Yet</h3>
                        <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                            It looks like you haven&apos;t placed any orders yet. Browse our delicious menu and check out your first meal!
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center gap-2 cursor-pointer text-sm"
                    >
                        Order Delicious Food
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-8 relative z-10">
                    
                    {/* --- Active Order Trackers --- */}
                    {activeOrders.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-extrabold text-orange-600 uppercase tracking-widest text-left pl-1">
                                Active Order Progress ({activeOrders.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {activeOrders.map((order) => {
                                    const StepIcon = getStatusStepIcon(order.status);
                                    const orderRef = `BF-${order.id.substring(0, 5).toUpperCase()}`;
                                    
                                    return (
                                        <div 
                                            key={order.id} 
                                            className="bg-white/90 backdrop-blur-md border border-orange-100 p-6 rounded-3xl hover:shadow-lg transition-all space-y-4 text-left flex flex-col justify-between"
                                        >
                                            <div className="space-y-3.5">
                                                {/* Header Row */}
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-gray-400">Ref: {orderRef}</span>
                                                    <span className={`text-[10px] uppercase py-1 px-2.5 rounded-full tracking-wider ${getStatusBadgeClass(order.status)}`}>
                                                        {getStatusStepLabel(order.status)}
                                                    </span>
                                                </div>

                                                {/* Info row */}
                                                <div className="flex items-start gap-3">
                                                    <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl ring-4 ring-orange-50/50 mt-0.5 animate-pulse">
                                                        <StepIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-extrabold text-gray-900 text-base leading-snug">
                                                            {getStatusStepLabel(order.status)}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            Total: <span className="font-extrabold text-gray-800">${order.total_price.toFixed(2)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Track button */}
                                            <Link
                                                href={`/order-success?orderId=${order.id}`}
                                                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase tracking-wide mt-2"
                                            >
                                                Track Live Delivery
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- Order History (Collapsible Accordions) --- */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-widest text-left pl-1">
                            Past Order Transactions ({pastOrders.length})
                        </h3>
                        <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                            {pastOrders.map((order) => {
                                const isExpanded = expandedOrderId === order.id;
                                const orderRef = `BF-${order.id.substring(0, 5).toUpperCase()}`;
                                const dateFormatted = new Date(order.created_at).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                });
                                const isReordering = isReorderingMap[order.id] || false;

                                return (
                                    <div key={order.id} className="transition-colors hover:bg-gray-50/30">
                                        {/* Accordion Trigger Header */}
                                        <div 
                                            onClick={() => toggleExpandOrder(order.id)}
                                            className="w-full px-6 py-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none text-left"
                                        >
                                            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                                                {/* Date */}
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {dateFormatted}
                                                </div>

                                                {/* Ref tag */}
                                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                                                    {orderRef}
                                                </span>

                                                {/* Total Price */}
                                                <span className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                                    Total Paid: <span className="font-extrabold text-orange-500">${order.total_price.toFixed(2)}</span>
                                                </span>
                                            </div>

                                            {/* Status Pill & Expand Caret */}
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] uppercase py-0.5 px-2.5 rounded-full tracking-wider font-extrabold ${getStatusBadgeClass(order.status)}`}>
                                                    {order.status}
                                                </span>
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                            </div>
                                        </div>

                                        {/* Expanded Details Body */}
                                        {isExpanded && (
                                            <div className="px-6 pb-6 pt-2 border-t border-gray-50/50 bg-gray-50/30 space-y-5 animate-fadeIn">
                                                {/* Items summary */}
                                                <div className="space-y-2.5 text-left">
                                                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-0.5">Ordered Receipts</h5>
                                                    <div className="bg-white rounded-2xl border border-gray-100 p-4 divide-y divide-gray-50 shadow-sm max-w-2xl text-left">
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
                                                                            <div className="space-y-0.5 min-w-0">
                                                                                <span className="font-semibold text-sm text-gray-900 block truncate">{metaItem.name}</span>
                                                                                {metaItem.customization && (
                                                                                    <div className="text-[10px] text-gray-400 font-semibold space-y-0.5 mt-0.5 pl-1.5 border-l border-orange-500/30 text-left">
                                                                                        {metaItem.customization.size && (
                                                                                            <p className="leading-tight">
                                                                                                Portion: <span className="text-gray-600 font-bold">{metaItem.customization.size}</span>
                                                                                            </p>
                                                                                        )}
                                                                                        {(metaItem.customization.addons && metaItem.customization.addons.length > 0) && (
                                                                                            <p className="leading-tight">
                                                                                                Toppings: <span className="text-orange-500">{metaItem.customization.addons.join(", ")}</span>
                                                                                            </p>
                                                                                        )}
                                                                                        {metaItem.customization.instructions && (
                                                                                            <p className="italic text-gray-400 font-normal leading-tight">
                                                                                                Note: &quot;{metaItem.customization.instructions}&quot;
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                                <p className="text-xs text-gray-400 mt-0.5">Qty: {metaItem.quantity} @ ${metaItem.price.toFixed(2)}</p>
                                                                            </div>
                                                                        </div>
                                                                        <span className="font-bold text-sm text-gray-800 shrink-0">${(metaItem.price * metaItem.quantity).toFixed(2)}</span>
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
                                                                                    className="w-10 h-10 object-cover rounded-lg border border-gray-100 bg-gray-50 shrink-0"
                                                                                />
                                                                            )}
                                                                            <div className="space-y-0.5 min-w-0">
                                                                                <span className="font-semibold text-sm text-gray-900 block truncate">{item.products?.name || "Deleted Dish"}</span>
                                                                                <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} @ ${item.price_at_time.toFixed(2)}</p>
                                                                            </div>
                                                                        </div>
                                                                        <span className="font-bold text-sm text-gray-800 shrink-0">${(item.price_at_time * item.quantity).toFixed(2)}</span>
                                                                    </div>
                                                                ));
                                                            }

                                                            return (
                                                                <div className="py-6 px-4 text-center space-y-3">
                                                                    <div className="p-3 bg-orange-50 text-orange-500 rounded-full inline-block">
                                                                        <ShoppingBag className="w-6 h-6" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-sm font-extrabold text-gray-850 text-gray-800">Receipt Details Unavailable</p>
                                                                        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                                                                            This order was placed on another device/session, or your local browser metadata has been cleared.
                                                                        </p>
                                                                    </div>
                                                                    <div className="pt-2">
                                                                        <span className="inline-flex items-center gap-1 bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1.5 rounded-xl text-xs font-bold">
                                                                            Total Paid: ${order.total_price.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>

                                                {/* Re-order & Track detail Row */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <button
                                                        onClick={() => handleReorder(order)}
                                                        disabled={isReordering}
                                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50"
                                                    >
                                                        {isReordering ? (
                                                            <>
                                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                Adding to Cart...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <RefreshCw className="w-3.5 h-3.5" />
                                                                Re-order Items
                                                            </>
                                                        )}
                                                    </button>
                                                    
                                                    <Link
                                                        href={`/order-success?orderId=${order.id}`}
                                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs border border-gray-200/50"
                                                    >
                                                        View Order Summary
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </Link>

                                                    <button
                                                        onClick={() => setConfirmDeleteId(order.id)}
                                                        disabled={isDeletingMap[order.id]}
                                                        className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs border border-red-200/50 disabled:opacity-50"
                                                    >
                                                        {isDeletingMap[order.id] ? (
                                                            <>
                                                                <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                                                Removing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Remove Order
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
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-gray-100 shadow-2xl relative space-y-6 text-center animate-scaleUp">
                        {/* Red warning icon */}
                        <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center ring-4 ring-red-50/50">
                            <Trash2 className="w-8 h-8" />
                        </div>

                        {/* Title and Description */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-extrabold text-gray-900 leading-tight">Remove Transaction History?</h3>
                            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                                This will permanently remove order <span className="font-extrabold text-gray-700">BF-{confirmDeleteId.substring(0, 5).toUpperCase()}</span> from your dashboard records. This action cannot be undone.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wide border border-gray-200/50"
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={() => handleDeleteOrder(confirmDeleteId)}
                                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs uppercase tracking-wide flex items-center justify-center gap-1.5"
                            >
                                {isDeletingMap[confirmDeleteId] ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Removing...
                                    </>
                                ) : (
                                    "Remove"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
