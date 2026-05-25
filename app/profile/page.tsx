// app/profile/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { 
    User as UserIcon, Phone, MapPin, Mail, Sparkles, 
    ArrowLeft, Save, RefreshCw, LogOut, Shield, Camera
} from "lucide-react";
import { isUserAdmin } from "@/lib/supabase/admin";
import { useTranslation } from "@/lib/translations";

interface ProfileMeta {
    username: string;
    address: string;
    city: string;
    phoneNumber: string;
    avatarUrl?: string;
}

export default function CustomerProfilePage() {
    const router = useRouter();
    const { t, lang } = useTranslation();
    
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
    const [avatarUrl, setAvatarUrl] = useState<string>("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Error validations
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        async function fetchSession() {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    toast.error(
                        lang === 'ar'
                            ? "يرجى تسجيل الدخول للوصول إلى إعدادات حسابك."
                            : "Please sign in to access your profile settings.",
                        {
                            style: { border: '1px solid #F59E0B', padding: '16px', color: '#B45309', fontWeight: 'bold' }
                        }
                    );
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
                    if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
                }
            } catch (err) {
                console.error("Profile session load error:", err);
            } finally {
                setIsCheckingSession(false);
            }
        }
        fetchSession();
    }, [router, lang]);

    function triggerFileInput() {
        fileInputRef.current?.click();
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error(lang === 'ar' ? "يرجى اختيار ملف صورة صالح." : "Please select a valid image file.");
            return;
        }

        if (file.size > 1.5 * 1024 * 1024) {
            toast.error(
                lang === 'ar'
                    ? "الصورة المحددة كبيرة جداً. يرجى اختيار صورة أقل من 1.5 ميجابايت."
                    : "Selected image is too large. Please select a photo under 1.5MB."
            );
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setAvatarUrl(dataUrl);
            toast.success(
                lang === 'ar' ? "تم تحميل صورة الملف الشخصي! اضغط حفظ للتطبيق." : "Profile picture loaded! Click Save to apply.",
                {
                    style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
                }
            );
        };
        reader.onerror = () => {
            toast.error(lang === 'ar' ? "فشل في قراءة ملف الصورة." : "Failed to read image file.");
        };
        reader.readAsDataURL(file);
    }

    async function handleSaveChanges(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};
        if (!username.trim()) {
            newErrors.username = lang === 'ar' ? "اسم العرض لا يمكن أن يكون فارغاً." : "Display name cannot be empty.";
        }
        if (phoneNumber.trim() && phoneNumber.length < 7) {
            newErrors.phoneNumber = lang === 'ar' ? "رقم الهاتف يجب أن يتكون من 7 أرقام على الأقل." : "Phone number must be at least 7 digits.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error(lang === 'ar' ? "يرجى ملء الحقول بشكل صحيح." : "Please fill in the fields correctly.");
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
                    phoneNumber: phoneNumber.trim(),
                    avatarUrl: avatarUrl
                })
            );

            // Dispatch global event to notify layout headers of avatar change
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("profile-update"));
            }

            toast.success(
                lang === 'ar' ? "تم تحديث تفاصيل الملف الشخصي بنجاح!" : "Profile details updated successfully!",
                {
                    style: {
                        border: '1px solid #10B981',
                        padding: '16px',
                        color: '#047857',
                        fontWeight: 'bold',
                    }
                }
            );
        } catch (err) {
            console.error("Save profile error:", err);
            const errMsg = err instanceof Error ? err.message : (lang === 'ar' ? "حدث خطأ أثناء حفظ تغييرات الملف الشخصي." : "An error occurred while saving profile changes.");
            toast.error(errMsg);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSignOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error((lang === 'ar' ? "خطأ في تسجيل الخروج: " : "Error signing out: ") + error.message);
        } else {
            toast.success(lang === 'ar' ? "تم تسجيل الخروج بنجاح." : "Signed out successfully.", {
                style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
            });
            router.push("/");
        }
    }

    if (isCheckingSession) {
        return (
            <div className="min-h-[80vh] flex flex-col justify-center items-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                    {lang === 'ar' ? "جاري تحميل إعدادات الحساب..." : "Loading Profile Settings..."}
                </p>
            </div>
        );
    }

    const avatarLetter = (username || userEmail || "U").charAt(0).toUpperCase();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-100/40 dark:bg-orange-950/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-red-100/40 dark:bg-red-950/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-[#22222e] pb-5 relative z-10">
                <div className="space-y-1 text-start">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
                        <UserIcon className="w-8 h-8 text-orange-500" />
                        {t.profileTitle}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t.profileSubtitle}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-[#1a1a24] hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-500 border border-gray-200/60 dark:border-[#22222e] text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t.btnBackMenu}
                </button>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                
                {/* Left Column: Avatar Widget & Shortcuts */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-[#121216]/90 p-6 rounded-3xl border border-gray-100 dark:border-[#22222e] shadow-sm text-center space-y-5">
                        <div 
                            onClick={triggerFileInput}
                            className="relative inline-flex group cursor-pointer"
                            title={lang === 'ar' ? "انقر لتحميل صورة الملف الشخصي" : "Click to upload profile photo"}
                        >
                            <div className="absolute inset-0 bg-orange-100 dark:bg-orange-950/30 rounded-full blur-xl opacity-50 scale-125 animate-pulse"></div>
                            {/* Avatar Badge */}
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-[#22222e] relative z-10 shadow-lg shadow-orange-500/20 bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                {avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img 
                                        src={avatarUrl} 
                                        alt="Profile Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white text-4xl font-black uppercase">{avatarLetter}</span>
                                )}
                                
                                {/* Camera hover overlay */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 p-1.5 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded-full shadow-md z-20 border border-white dark:border-[#22222e]">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                                accept="image/*" 
                            />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 truncate">
                                {username || (lang === 'ar' ? "عميل بايت فلو" : "BiteFlow Diners")}
                            </h3>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate font-semibold" title={userEmail}>
                                {userEmail}
                            </p>
                        </div>

                        {isAdmin && (
                            <div className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                                <Shield className="w-3.5 h-3.5" />
                                {lang === 'ar' ? "صلاحيات المشرف" : "Admin privileges"}
                            </div>
                        )}

                        <div className="border-t border-gray-50 dark:border-[#22222e]/40 pt-4 flex flex-col gap-2.5">
                            <button
                                type="button"
                                onClick={() => router.push("/orders")}
                                className="w-full bg-gray-50 dark:bg-[#1a1a24] hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-500 dark:text-gray-300 font-bold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer border border-gray-100 dark:border-[#22222e]/60"
                            >
                                {t.btnViewOrderHistory}
                            </button>
                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="w-full bg-red-50 dark:bg-red-950/20 hover:bg-red-100 text-red-600 dark:text-red-400 font-bold py-3 px-4 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 border border-red-100/50 dark:border-red-900/40"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                {t.btnLogoutSession}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Profile Edit Form */}
                <form onSubmit={handleSaveChanges} className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-[#121216]/90 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-[#22222e] shadow-sm space-y-6 text-start">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b pb-3 border-gray-50 dark:border-[#22222e]/40 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-orange-500" />
                            {t.profileSectionPersonal}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Display Name Input */}
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.lblUsername}</label>
                                <input
                                    type="text"
                                    placeholder={lang === 'ar' ? "اسم المستخدم" : "Username"}
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (errors.username) setErrors(prev => ({ ...prev, username: "" }));
                                    }}
                                    className={`w-full border p-3.5 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50/50 dark:bg-[#161622]/50 focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.username 
                                            ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 dark:border-[#22222e] focus:ring-orange-500/20 focus:border-orange-500"
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
                                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5" /> {t.lblEmail}
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    value={userEmail}
                                    className="w-full border border-gray-100 dark:border-[#22222e]/40 p-3.5 rounded-xl text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#161622]/30 font-medium cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Autofill delivery details */}
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b pb-3 border-gray-50 dark:border-[#22222e]/40 flex items-center gap-2 pt-4">
                            <MapPin className="w-5 h-5 text-orange-500" />
                            {t.profileSectionDelivery}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Street Address */}
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.lblAddress}</label>
                                <input
                                    type="text"
                                    placeholder={lang === 'ar' ? "مثال: 123 الشارع الرئيسي، شقة 4ب" : "e.g. 123 Main St, Apt 4B"}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-[#22222e] p-3.5 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50/50 dark:bg-[#161622]/50 focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                />
                            </div>

                            {/* City */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.lblCity}</label>
                                <input
                                    type="text"
                                    placeholder={lang === 'ar' ? "مثال: الرياض" : "e.g. Springfield"}
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-[#22222e] p-3.5 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50/50 dark:bg-[#161622]/50 focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {t.lblPhone}
                                </label>
                                <input
                                    type="tel"
                                    placeholder={lang === 'ar' ? "مثال: 0555019283" : "e.g. 555-019-2834"}
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        setPhoneNumber(e.target.value);
                                        if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: "" }));
                                    }}
                                    className={`w-full border p-3.5 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50/50 dark:bg-[#161622]/50 focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:ring-2 transition-all font-medium text-start ${
                                        errors.phoneNumber 
                                            ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 dark:border-[#22222e] focus:ring-orange-500/20 focus:border-orange-500"
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
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base mt-4 animate-pulse-subtle"
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    {t.btnSavingProfile}
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {t.btnSaveProfile}
                                </>
                            )}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
