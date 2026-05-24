// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { 
    User as UserIcon, Phone, MapPin, Mail, Sparkles, 
    ArrowLeft, Save, RefreshCw, LogOut, Shield
} from "lucide-react";
import { isUserAdmin } from "@/lib/supabase/admin";

interface ProfileMeta {
    username: string;
    address: string;
    city: string;
    phoneNumber: string;
}

export default function CustomerProfilePage() {
    const router = useRouter();
    
    // Auth and loading states
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string>("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form inputs
    const [username, setUsername] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    
    // Error validations
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        async function fetchSession() {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    toast.error("Please sign in to access your profile settings.", {
                        style: { border: '1px solid #F59E0B', padding: '16px', color: '#B45309', fontWeight: 'bold' }
                    });
                    router.push("/login");
                    return;
                }

                setUserId(user.id);
                setUserEmail(user.email || "");
                setIsAdmin(isUserAdmin(user));
                
                // Set default username from auth metadata
                const metaUsername = user.user_metadata?.username || "";
                setUsername(metaUsername);

                // Load saved metadata from local storage
                const localMetaStr = localStorage.getItem(`biteflow-profile-meta-${user.id}`);
                if (localMetaStr) {
                    const parsed = JSON.parse(localMetaStr) as ProfileMeta;
                    if (parsed.username) setUsername(parsed.username);
                    if (parsed.address) setAddress(parsed.address);
                    if (parsed.city) setCity(parsed.city);
                    if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
                }
            } catch (err) {
                console.error("Profile session load error:", err);
            } finally {
                setIsCheckingSession(false);
            }
        }
        fetchSession();
    }, [router]);

    async function handleSaveChanges(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};
        if (!username.trim()) newErrors.username = "Display name cannot be empty.";
        if (phoneNumber.trim() && phoneNumber.length < 7) {
            newErrors.phoneNumber = "Phone number must be at least 7 digits.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill in the fields correctly.");
            return;
        }

        if (!userId) return;

        setIsSaving(true);
        try {
            // 1. Update Supabase Auth metadata for real-time navbar updates
            const { error: authError } = await supabase.auth.updateUser({
                data: { username: username.trim() }
            });

            if (authError) {
                throw new Error(authError.message);
            }

            // 2. Cache metadata in local storage for checkout autofill
            localStorage.setItem(
                `biteflow-profile-meta-${userId}`,
                JSON.stringify({
                    username: username.trim(),
                    address: address.trim(),
                    city: city.trim(),
                    phoneNumber: phoneNumber.trim()
                })
            );

            toast.success("Profile details updated successfully!", {
                style: {
                    border: '1px solid #10B981',
                    padding: '16px',
                    color: '#047857',
                    fontWeight: 'bold',
                }
            });
        } catch (err) {
            console.error("Save profile error:", err);
            const errMsg = err instanceof Error ? err.message : "An error occurred while saving profile changes.";
            toast.error(errMsg);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSignOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("Error signing out: " + error.message);
        } else {
            toast.success("Signed out successfully.", {
                style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
            });
            router.push("/");
        }
    }

    if (isCheckingSession) {
        return (
            <div className="min-h-[80vh] flex flex-col justify-center items-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Loading Profile Settings...</p>
            </div>
        );
    }

    const avatarLetter = (username || userEmail || "U").charAt(0).toUpperCase();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-100/40 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-red-100/40 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5 relative z-10">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        <UserIcon className="w-8 h-8 text-orange-500" />
                        My Account Settings
                    </h1>
                    <p className="text-sm text-gray-500">
                        Customize your dining profile and manage your pre-filled shipping locations.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-orange-50 hover:text-orange-500 border border-gray-200/60 text-gray-600 px-4 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Menu
                </button>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                
                {/* Left Column: Avatar Widget & Shortcuts */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center space-y-5">
                        <div className="relative inline-flex">
                            <div className="absolute inset-0 bg-orange-100 rounded-full blur-xl opacity-50 scale-125 animate-pulse"></div>
                            {/* Avatar Badge */}
                            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-4xl font-black uppercase shadow-lg shadow-orange-500/20 border-4 border-white relative z-10">
                                {avatarLetter}
                            </div>
                            <div className="absolute bottom-0 right-0 p-1.5 bg-orange-100 text-orange-600 rounded-full shadow-md z-20 border border-white">
                                <Sparkles className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-lg font-extrabold text-gray-900 truncate">
                                {username || "BiteFlow Diners"}
                            </h3>
                            <p className="text-xs text-gray-400 truncate font-semibold" title={userEmail}>
                                {userEmail}
                            </p>
                        </div>

                        {isAdmin && (
                            <div className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200/50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                                <Shield className="w-3.5 h-3.5" />
                                Admin privileges
                            </div>
                        )}

                        <div className="border-t border-gray-50 pt-4 flex flex-col gap-2.5">
                            <button
                                type="button"
                                onClick={() => router.push("/orders")}
                                className="w-full bg-gray-50 hover:bg-orange-50 hover:text-orange-500 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer border border-gray-100"
                            >
                                View Order History
                            </button>
                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 border border-red-100/50"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Logout Session
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Profile Edit Form */}
                <form onSubmit={handleSaveChanges} className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-left">
                        <h3 className="text-lg font-bold text-gray-900 border-b pb-3 border-gray-50 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-orange-500" />
                            Personal Details
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Display Name Input */}
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-xs font-bold text-gray-500">Display Name / Username</label>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (errors.username) setErrors(prev => ({ ...prev, username: "" }));
                                    }}
                                    className={`w-full border p-3.5 rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.username 
                                            ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                                    }`}
                                />
                                {errors.username && (
                                    <span className="text-xs font-bold text-red-500 mt-1 block">
                                        {errors.username}
                                    </span>
                                )}
                            </div>

                            {/* Email Address Input (Disabled) */}
                            <div className="space-y-1 sm:col-span-2 opacity-75">
                                <label className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5" /> Email Address (Primary Identity)
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    value={userEmail}
                                    className="w-full border border-gray-100 p-3.5 rounded-xl text-gray-400 bg-gray-50 font-medium cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Autofill delivery details */}
                        <h3 className="text-lg font-bold text-gray-900 border-b pb-3 border-gray-50 flex items-center gap-2 pt-4">
                            <MapPin className="w-5 h-5 text-orange-500" />
                            Default Delivery Address (Checkout Autofill)
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Street Address */}
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-xs font-bold text-gray-500">Street Address</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 123 Main St, Apt 4B"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full border border-gray-200 p-3.5 rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                />
                            </div>

                            {/* City */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">City / Region</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Springfield"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full border border-gray-200 p-3.5 rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    placeholder="e.g. 555-019-2834"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        setPhoneNumber(e.target.value);
                                        if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: "" }));
                                    }}
                                    className={`w-full border p-3.5 rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.phoneNumber 
                                            ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                                    }`}
                                />
                                {errors.phoneNumber && (
                                    <span className="text-xs font-bold text-red-500 mt-1 block">
                                        {errors.phoneNumber}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Save Trigger Button */}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base mt-4"
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Saving profile...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Profile Settings
                                </>
                            )}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
