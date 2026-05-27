// app/reset-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock, ArrowLeft, RefreshCw, AlertCircle, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/lib/translations";
import { useSettingsStore } from "@/store/settings";

export default function ResetPasswordPage() {
    const router = useRouter();
    const { t, lang } = useTranslation();
    const theme = useSettingsStore((state) => state.theme);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Verify recovery session exists
    useEffect(() => {
        async function checkRecoverySession() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    toast.error(
                        lang === 'ar'
                            ? "جلسة غير صالحة أو منتهية الصلاحية. يرجى طلب رابط استعادة جديد."
                            : "Invalid or expired recovery session. Please request a new link.",
                        {
                            style: theme === 'dark'
                                ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                                : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                        }
                    );
                    router.push("/login");
                } else {
                    setIsChecking(false);
                }
            } catch (err) {
                console.error("Recovery session error:", err);
                router.push("/login");
            }
        }
        checkRecoverySession();
    }, [router, lang, theme]);

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};
        
        if (!password) {
            newErrors.password = lang === 'ar' ? "يرجى إدخال كلمة المرور." : "Please enter your password.";
        } else if (password.length < 6) {
            newErrors.password = t.resetErrShort;
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = lang === 'ar' ? "يرجى تأكيد كلمة المرور." : "Please confirm your password.";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = t.resetErrMismatch;
        }

        const isDark = theme === "dark";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error(
                lang === 'ar' ? "يرجى التحقق من المدخلات." : "Please verify your password details.",
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
                }
            );
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            toast.success(
                t.resetSuccess,
                {
                    style: isDark
                        ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                        : { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' },
                    iconTheme: {
                        primary: '#10B981',
                        secondary: '#FFFAEE',
                    },
                }
            );

            setTimeout(() => {
                router.push("/login");
            }, 1800);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error 
                ? error.message 
                : (lang === 'ar' ? "فشل تحديث كلمة المرور." : "Failed to update password.");
            
            toast.error(errorMessage, {
                style: isDark
                    ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                    : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (isChecking) {
        return (
            <div className="min-h-[80vh] flex flex-col justify-center items-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-505 dark:text-gray-400 font-medium animate-pulse">
                    {lang === 'ar' ? "جاري التحقق من الصلاحيات..." : "Verifying recovery token..."}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 via-white to-gray-50 dark:from-[#0d0d11] dark:via-[#121216] dark:to-[#0f0f13] relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100/40 dark:bg-orange-950/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-red-50/40 dark:bg-red-950/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Back Link */}
                <button 
                    onClick={() => router.push("/login")}
                    className="inline-flex items-center gap-2 text-sm text-gray-505 dark:text-gray-400 hover:text-orange-500 transition-colors group font-semibold text-start cursor-pointer bg-transparent border-none"
                >
                    <ArrowLeft className={`w-4 h-4 transform ${lang === 'ar' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`} />
                    {t.authBackMenu}
                </button>

                <div className="bg-white/80 dark:bg-[#121216]/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-[#22222e] space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex p-3 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-2xl mb-2">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                            {t.resetTitle}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {t.resetSubtitle}
                        </p>
                    </div>

                    <form onSubmit={handleResetPassword} noValidate className="space-y-5 text-start">
                        {/* New Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                                {lang === 'ar' ? "كلمة المرور الجديدة" : "New Password"}
                            </label>
                            <div className="relative">
                                <span className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center text-gray-400 pointer-events-none`}>
                                    <Lock className="w-5 h-5" />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t.authPlaceholderPassword}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                                    }}
                                    className={`block w-full ${lang === 'ar' ? 'pr-11 pl-11' : 'pl-11 pr-11'} py-3 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-550 bg-gray-50/50 dark:bg-[#161622]/50 focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.password 
                                            ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 dark:border-[#22222e] focus:ring-orange-500/20 focus:border-orange-500"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute inset-y-0 ${lang === 'ar' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer`}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    {errors.password}
                                </span>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                                {lang === 'ar' ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
                            </label>
                            <div className="relative">
                                <span className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center text-gray-400 pointer-events-none`}>
                                    <Lock className="w-5 h-5" />
                                </span>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder={t.authPlaceholderPassword}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" }));
                                    }}
                                    className={`block w-full ${lang === 'ar' ? 'pr-11 pl-11' : 'pl-11 pr-11'} py-3 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-550 bg-gray-50/50 dark:bg-[#161622]/50 focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.confirmPassword 
                                            ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 dark:border-[#22222e] focus:ring-orange-500/20 focus:border-orange-500"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className={`absolute inset-y-0 ${lang === 'ar' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer`}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    {errors.confirmPassword}
                                </span>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    {t.resetUpdating}
                                </>
                            ) : (
                                t.resetBtnUpdate
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
