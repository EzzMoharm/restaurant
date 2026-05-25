// app/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, CreditCard, DollarSign, Gift, MapPin, Phone, ShoppingBag, User, AlertCircle } from "lucide-react";

export default function CheckoutPage() {
    const router = useRouter();
    const { items, cartTotal, clearCart } = useCartStore();
    
    // Auth & Loading States
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Form Fields
    const [fullName, setFullName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' or 'cod'

    // Mock Card Fields
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");

    // Promo Code States
    const [promoCode, setPromoCode] = useState("");
    const [discountAmount, setDiscountAmount] = useState(0);
    const [appliedPromo, setAppliedPromo] = useState("");

    // Hydration check
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        //eslint-disable-next-line
        setIsMounted(true);

        async function verifySession() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please sign in to access the checkout.", {
                    style: { border: '1px solid #F59E0B', padding: '16px', color: '#B45309', fontWeight: 'bold' }
                });
                router.push("/login");
            } else {
                setUserId(user.id);
                // Pre-fill delivery details from saved profile metadata if present
                const savedMeta = localStorage.getItem(`biteflow-profile-meta-${user.id}`);
                if (savedMeta) {
                    const parsed = JSON.parse(savedMeta);
                    setFullName(parsed.username || user.user_metadata?.username || "");
                    setAddress(parsed.address || "");
                    setCity(parsed.city || "");
                    setPhoneNumber(parsed.phoneNumber || "");
                } else {
                    setFullName(user.user_metadata?.username || "");
                }
                setIsCheckingSession(false);
            }
        }
        verifySession();
    }, [router]);

    // Apply Promo Code
    function handleApplyPromo(e: React.FormEvent) {
        e.preventDefault();
        const code = promoCode.trim().toUpperCase();
        
        if (appliedPromo) {
            return toast.error("A promo code has already been applied.");
        }

        const subtotal = cartTotal();

        if (code === "WELCOME10") {
            setDiscountAmount(subtotal * 0.10);
            setAppliedPromo("WELCOME10 (10% Off)");
            toast.success("10% discount applied!");
        } else if (code === "BITE5") {
            setDiscountAmount(Math.min(5, subtotal));
            setAppliedPromo("BITE5 ($5.00 Off)");
            toast.success("$5.00 discount applied!");
        } else if (code === "FREE") {
            setDiscountAmount(subtotal);
            setAppliedPromo("FREE (100% Off)");
            toast.success("100% discount applied! Enjoy your free meal.");
        } else {
            toast.error("Invalid promo code. Try WELCOME10, BITE5, or FREE.");
        }
        setPromoCode("");
    }

    // Submit Checkout
    async function handlePlaceOrder(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};
        if (!fullName.trim()) newErrors.fullName = "Please enter your name.";
        if (!address.trim()) newErrors.address = "Please enter your street address.";
        if (!city.trim()) newErrors.city = "Please enter your city.";
        if (!phoneNumber.trim()) newErrors.phoneNumber = "Please enter your phone number.";

        if (paymentMethod === "card") {
            const cleanCard = cardNumber.replace(/\s/g, "");
            if (!cardNumber.trim()) {
                newErrors.cardNumber = "Please enter your card number.";
            } else if (cleanCard.length < 16) {
                newErrors.cardNumber = "Card number must be 16 digits.";
            }

            if (!cardExpiry.trim()) {
                newErrors.cardExpiry = "Please enter expiry date.";
            } else if (cardExpiry.length < 5) {
                newErrors.cardExpiry = "Expiry format must be MM/YY.";
            }

            if (!cardCvv.trim()) {
                newErrors.cardCvv = "Please enter CVV.";
            } else if (cardCvv.length < 3) {
                newErrors.cardCvv = "CVV must be 3 digits.";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill in all fields correctly.", {
                style: { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
            });
            return;
        }

        if (!userId) return;

        setIsPlacingOrder(true);

        try {
            // 1. Insert order into the database
            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .insert({
                    user_id: userId,
                    total_price: grandTotal,
                    status: "pending"
                })
                .select();

            if (orderError) {
                console.error("Order insertion error:", orderError);
                throw new Error(orderError.message);
            }

            if (!orderData || orderData.length === 0) {
                throw new Error("Failed to retrieve placed order metadata.");
            }

            const orderId = orderData[0].id;

            // 2. Insert order items
            const orderItemsInsert = items.map((item) => {
                const prodId = item.customization?.productId || item.id.substring(0, 36);
                return {
                    order_id: orderId,
                    product_id: prodId,
                    quantity: item.quantity,
                    price_at_time: item.price
                };
            });

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItemsInsert);

            if (itemsError) {
                console.error("Order items insertion error:", itemsError);
                throw new Error(itemsError.message);
            }

            // 3. Store delivery metadata in localStorage for shared access (customer + admin)
            localStorage.setItem(
                `biteflow-order-meta-${orderId}`,
                JSON.stringify({
                    fullName,
                    address,
                    city,
                    phoneNumber,
                    paymentMethod,
                    items: items.map((item) => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        customization: item.customization
                    })),
                    discountAmount,
                    grandTotal,
                    createdAt: new Date().toISOString()
                })
            );

            // 4. Clear cart
            clearCart();

            // 5. Display success toast matching BiteFlow system
            toast.success("Order placed successfully!", {
                style: {
                    border: '1px solid #10B981',
                    padding: '16px',
                    color: '#047857',
                    fontWeight: 'bold',
                },
                iconTheme: {
                    primary: '#10B981',
                    secondary: '#FFFAEE',
                },
            });

            // 6. Redirect to success screen
            router.push(`/order-success?orderId=${orderId}`);

        } catch (error) {
            console.error("Checkout process error:", error);
            const errMsg = error instanceof Error ? error.message : "An error occurred while checkout was processing.";
            toast.error(errMsg, {
                style: { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
            });
        } finally {
            setIsPlacingOrder(false);
        }
    }

    if (!isMounted || isCheckingSession) {
        return (
            <div className="min-h-[80vh] flex flex-col justify-center items-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Initializing Checkout Portal...</p>
            </div>
        );
    }

    // Calculations
    const subtotal = cartTotal();
    const deliveryFee = 3.99;
    const tax = subtotal * 0.08;
    const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee + tax);

    // Empty Cart State
    if (items.length === 0) {
        return (
            <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 space-y-6 text-center">
                <div className="p-5 bg-orange-100 text-orange-600 rounded-full animate-pulse">
                    <ShoppingBag className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-extrabold text-gray-900">Your Cart is Empty</h2>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Add some fresh and delicious dishes to your cart before proceeding to checkout.
                    </p>
                </div>
                <Link
                    href="/"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer"
                >
                    Browse Menu
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            {/* Header / Back Link */}
            <div className="flex items-center justify-between border-b pb-4">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition-colors group font-bold">
                    <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                    Back to Menu
                </Link>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Checkout Gate</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column - Delivery & Payment Form */}
                <form id="checkout-form" onSubmit={handlePlaceOrder} noValidate className="lg:col-span-7 space-y-6">
                    {/* Delivery Details Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-3 border-gray-50">
                            <MapPin className="w-5 h-5 text-orange-500" />
                            1. Delivery Address
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" /> Full Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    value={fullName}
                                    onChange={(e) => {
                                        setFullName(e.target.value);
                                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: "" }));
                                    }}
                                    className={`w-full border p-3 rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.fullName 
                                            ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                                    }`}
                                />
                                {errors.fullName && (
                                    <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        {errors.fullName}
                                    </span>
                                )}
                            </div>

                            {/* Street Address */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">Street Address</label>
                                <input
                                    type="text"
                                    placeholder="Your address"
                                    value={address}
                                    onChange={(e) => {
                                        setAddress(e.target.value);
                                        if (errors.address) setErrors(prev => ({ ...prev, address: "" }));
                                    }}
                                    className={`w-full border p-3 rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.address 
                                            ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                                    }`}
                                />
                                {errors.address && (
                                    <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        {errors.address}
                                    </span>
                                )}
                            </div>

                            {/* City */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">City / Region</label>
                                <input
                                    type="text"
                                    placeholder="Your city"
                                    value={city}
                                    onChange={(e) => {
                                        setCity(e.target.value);
                                        if (errors.city) setErrors(prev => ({ ...prev, city: "" }));
                                    }}
                                    className={`w-full border p-3 rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.city 
                                            ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                                    }`}
                                />
                                {errors.city && (
                                    <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        {errors.city}
                                    </span>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    placeholder="Your phone number"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        setPhoneNumber(e.target.value);
                                        if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: "" }));
                                    }}
                                    className={`w-full border p-3 rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.phoneNumber 
                                            ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                                    }`}
                                />
                                {errors.phoneNumber && (
                                    <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        {errors.phoneNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-3 border-gray-50">
                            <CreditCard className="w-5 h-5 text-orange-500" />
                            2. Payment Selection
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Card selection */}
                            <label className={`border p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-orange-500 bg-orange-50/20 font-bold' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="card"
                                        checked={paymentMethod === 'card'}
                                        onChange={() => {
                                            setPaymentMethod('card');
                                            setErrors({});
                                        }}
                                        className="text-orange-500 focus:ring-orange-500"
                                    />
                                    <span className="text-gray-900 text-sm">Credit / Debit Card</span>
                                </div>
                                <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-orange-500' : 'text-gray-400'}`} />
                            </label>

                            {/* COD selection */}
                            <label className={`border p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50/20 font-bold' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="cod"
                                        checked={paymentMethod === 'cod'}
                                        onChange={() => {
                                            setPaymentMethod('cod');
                                            setErrors({});
                                        }}
                                        className="text-orange-500 focus:ring-orange-500"
                                    />
                                    <span className="text-gray-900 text-sm">Cash on Delivery</span>
                                </div>
                                <DollarSign className={`w-5 h-5 ${paymentMethod === 'cod' ? 'text-orange-500' : 'text-gray-400'}`} />
                            </label>
                        </div>

                        {/* Payment Inputs */}
                        {paymentMethod === "card" && (
                            <div className="bg-gray-50/60 p-5 rounded-2xl border border-gray-100/50 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Mock Card Number */}
                                    <div className="space-y-1 sm:col-span-3">
                                        <label className="text-xs font-semibold text-gray-500">Card Number</label>
                                        <input
                                            type="text"
                                            placeholder="4111 2222 3333 4444"
                                            value={cardNumber}
                                            onChange={(e) => {
                                                setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16).match(/.{1,4}/g)?.join(" ") || "");
                                                if (errors.cardNumber) setErrors(prev => ({ ...prev, cardNumber: "" }));
                                            }}
                                            className={`w-full border p-3 rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                                                errors.cardNumber 
                                                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                                    : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                                            }`}
                                        />
                                        {errors.cardNumber && (
                                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                {errors.cardNumber}
                                            </span>
                                        )}
                                    </div>

                                    {/* Mock Expiry */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500">Expiry (MM/YY)</label>
                                        <input
                                            type="text"
                                            placeholder="12/29"
                                            value={cardExpiry}
                                            onChange={(e) => {
                                                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                                setCardExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                                                if (errors.cardExpiry) setErrors(prev => ({ ...prev, cardExpiry: "" }));
                                            }}
                                            className={`w-full border p-3 rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 transition-all font-medium text-center ${
                                                errors.cardExpiry 
                                                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                                    : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                                            }`}
                                        />
                                        {errors.cardExpiry && (
                                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                {errors.cardExpiry}
                                            </span>
                                        )}
                                    </div>

                                    {/* Mock CVV */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500">CVV</label>
                                        <input
                                            type="text"
                                            placeholder="123"
                                            value={cardCvv}
                                            onChange={(e) => {
                                                setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3));
                                                if (errors.cardCvv) setErrors(prev => ({ ...prev, cardCvv: "" }));
                                            }}
                                            className={`w-full border p-3 rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 transition-all font-medium text-center ${
                                                errors.cardCvv 
                                                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                                    : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                                            }`}
                                        />
                                        {errors.cardCvv && (
                                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                {errors.cardCvv}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Submit Button (Desktop Only) */}
                    <button
                        type="submit"
                        disabled={isPlacingOrder}
                        className="hidden lg:flex w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 items-center justify-center gap-2 cursor-pointer text-base"
                    >
                        {isPlacingOrder ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Authenticating & Placing Order...
                            </>
                        ) : (
                            `Complete Order - $${grandTotal.toFixed(2)}`
                        )}
                    </button>
                </form>

                {/* Right Column - Order Summary */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Itemized list */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-3 border-gray-50">
                            <ShoppingBag className="w-5 h-5 text-orange-500" />
                            Order Summary
                        </h2>

                        <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto pr-1">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between items-start py-3 first:pt-0 last:pb-0 text-left gap-4">
                                    <div className="space-y-0.5 flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h4>
                                        {item.customization && (
                                            <div className="text-[10px] text-gray-400 font-semibold space-y-0.5 mt-0.5 pl-1.5 border-l border-orange-500/30">
                                                {item.customization.size && (
                                                    <p className="leading-tight">
                                                        Portion: <span className="text-gray-600 font-bold">{item.customization.size}</span>
                                                    </p>
                                                )}
                                                {(item.customization.addons && item.customization.addons.length > 0) && (
                                                    <p className="leading-tight">
                                                        Toppings: <span className="text-orange-500">{item.customization.addons.join(", ")}</span>
                                                    </p>
                                                )}
                                                {item.customization.instructions && (
                                                    <p className="italic text-gray-400 font-normal leading-tight">
                                                        Note: &quot;{item.customization.instructions}&quot;
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity} @ ${item.price.toFixed(2)}</p>
                                    </div>
                                    <span className="font-bold text-sm text-gray-900 shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Mock Promo Code Input */}
                        <form onSubmit={handleApplyPromo} className="border-t border-gray-50 pt-4 flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                                    <Gift className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Enter WELCOME10 or BITE5"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    disabled={!!appliedPromo}
                                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium disabled:opacity-50"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!!appliedPromo || !promoCode}
                                className="bg-gray-900 hover:bg-orange-500 hover:text-white text-gray-100 font-bold px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-40 cursor-pointer"
                            >
                                Apply
                            </button>
                        </form>

                        {/* Price Details */}
                        <div className="border-t border-gray-50 pt-4 space-y-2.5 text-sm">
                            <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span className="flex items-center gap-1">
                                        <Gift className="w-3.5 h-3.5" /> Promo Discount
                                    </span>
                                    <span>-${discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-500">
                                <span>Delivery Fee</span>
                                <span>${deliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Tax (8%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            {appliedPromo && (
                                <div className="text-xs text-green-600 font-semibold bg-green-50/50 p-2 rounded-lg text-center">
                                    Applied: {appliedPromo}
                                </div>
                            )}
                            <div className="flex justify-between border-t border-gray-50 pt-3 text-base font-extrabold text-gray-900">
                                <span>Total Price</span>
                                <span>${grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Submit Button (Mobile Only) */}
            <button
                type="submit"
                form="checkout-form"
                disabled={isPlacingOrder}
                className="flex lg:hidden w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 items-center justify-center gap-2 cursor-pointer text-base mt-6"
            >
                {isPlacingOrder ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Authenticating & Placing Order...
                    </>
                ) : (
                    `Complete Order - $${grandTotal.toFixed(2)}`
                )}
            </button>
        </div>
    );
}
