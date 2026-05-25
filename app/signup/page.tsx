// app/signup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isUserAdmin } from "@/lib/supabase/admin";
import toast from "react-hot-toast";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, UserPlus, User as UserIcon, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/translations";
import { useSettingsStore } from "@/store/settings";
import { sanitizeText, sanitizeEmail } from "@/lib/security";

export default function SignupPage() {
    const router = useRouter();
    const { t, lang } = useTranslation();
    const theme = useSettingsStore((state) => state.theme);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Redirect if already logged in
    useEffect(() => {
        async function checkCurrentSession() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (isUserAdmin(user)) {
                    router.push("/admin");
                } else {
                    router.push("/");
                }
            } else {
                setIsCheckingSession(false);
            }
        }
        checkCurrentSession();
    }, [router]);

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});
        
        const cleanUsername = sanitizeText(username);
        const cleanEmail = sanitizeEmail(email);

        const newErrors: Record<string, string> = {};
        if (!cleanUsername) {
            newErrors.username = lang === 'ar' ? "يرجى إدخال اسم المستخدم." : "Please enter a username.";
        }
        
        if (!cleanEmail) {
            newErrors.email = lang === 'ar' ? "يرجى إدخال بريدك الإلكتروني." : "Please enter your email.";
        } else if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
            newErrors.email = lang === 'ar' ? "يرجى إدخال بريد إلكتروني صالح." : "Please enter a valid email address.";
        }
        
        if (!password) {
            newErrors.password = lang === 'ar' ? "يرجى إدخال كلمة مرور." : "Please enter a password.";
        } else if (password.length < 6) {
            newErrors.password = lang === 'ar' ? "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل." : "Password must be at least 6 characters.";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = lang === 'ar' ? "يرجى تأكيد كلمة المرور الخاصة بك." : "Please confirm your password.";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = lang === 'ar' ? "كلمات المرور غير متطابقة." : "Passwords do not match.";
        }

        const isDark = theme === "dark";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error(
                lang === 'ar' ? "يرجى ملء جميع الحقول بشكل صحيح." : "Please fill in all fields correctly.",
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
            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: {
                    data: {
                        username: cleanUsername,
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Force real email confirmation by immediately signing out any auto-generated session
                await supabase.auth.signOut();
                
                toast.success(
                    lang === 'ar' 
                        ? "تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد التسجيل قبل تسجيل الدخول." 
                        : "Account created! Please check your email inbox to confirm your registration before signing in.",
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
                router.push("/login");
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error 
                ? error.message 
                : (lang === 'ar' ? "فشل التسجيل. يرجى التحقق من بياناتك." : "Registration failed. Please check your credentials.");
            
            toast.error(errorMessage, {
                style: isDark
                    ? { border: '1px solid #22222e', padding: '16px', color: '#f3f4f6', backgroundColor: '#121216', fontWeight: 'bold' }
                    : { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (isCheckingSession) {
        return (
            <div className="min-h-[80vh] flex flex-col justify-center items-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-555 text-gray-500 dark:text-gray-400 font-medium animate-pulse">{t.authVerifyingSession}</p>
            </div>
        );
    }

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-55 via-white to-gray-55 dark:from-[#0d0d11] dark:via-[#121216] dark:to-[#0f0f13] relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100/40 dark:bg-orange-950/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-red-50/40 dark:bg-red-950/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Back Link */}
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-555 text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors group font-semibold text-start">
                    <ArrowLeft className={`w-4 h-4 transform ${lang === 'ar' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`} />
                    {t.authBackMenu}
                </Link>

                <div className="bg-white/80 dark:bg-[#121216]/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-[#22222e] space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex p-3 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-2xl mb-2">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                            {t.authSignUpTitle}
                        </h2>
                        <p className="text-gray-555 text-gray-500 dark:text-gray-400 text-sm">
                            {t.authSignUpSubtitle}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSignup} noValidate className="space-y-5 text-start">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                                {t.authLabelUsername}
                            </label>
                            <div className="relative">
                                <span className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center text-gray-400 pointer-events-none`}>
                                    <UserIcon className="w-5 h-5" />
                                </span>
                                <input
                                    type="text"
                                    placeholder={t.authPlaceholderUsername}
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (errors.username) setErrors(prev => ({ ...prev, username: "" }));
                                    }}
                                    className={`block w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-550 bg-gray-50/50 dark:bg-[#161622]/50 focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.username 
                                            ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 dark:border-[#22222e] focus:ring-orange-500/20 focus:border-orange-550"
                                    }`}
                                />
                            </div>
                            {errors.username && (
                                <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    {errors.username}
                                </span>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                                {t.authLabelEmail}
                            </label>
                            <div className="relative">
                                <span className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center text-gray-400 pointer-events-none`}>
                                    <Mail className="w-5 h-5" />
                                </span>
                                <input
                                    type="email"
                                    placeholder={t.authPlaceholderEmail}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                                    }}
                                    className={`block w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-550 bg-gray-55/50 dark:bg-[#161622]/50 focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.email 
                                            ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 dark:border-[#22222e] focus:ring-orange-500/20 focus:border-orange-550"
                                    }`}
                                />
                            </div>
                            {errors.email && (
                                <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    {errors.email}
                                </span>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                                {t.authLabelPassword}
                            </label>
                            <div className="relative">
                                <span className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center text-gray-400 pointer-events-none`}>
                                    <Lock className="w-5 h-5" />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                                    }}
                                    className={`block w-full ${lang === 'ar' ? 'pr-11 pl-11' : 'pl-11 pr-11'} py-3 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-550 bg-gray-50/50 dark:bg-[#161622]/50 focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.password 
                                            ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 dark:border-[#22222e] focus:ring-orange-500/20 focus:border-orange-555"
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
                                {t.authLabelConfirmPassword}
                            </label>
                            <div className="relative">
                                <span className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center text-gray-400 pointer-events-none`}>
                                    <Lock className="w-5 h-5" />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t.authPlaceholderConfirmPassword}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" }));
                                    }}
                                    className={`block w-full ${lang === 'ar' ? 'pr-11 pl-11' : 'pl-11 pr-11'} py-3 border rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-550 bg-gray-50/50 dark:bg-[#161622]/50 focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.confirmPassword 
                                            ? "border-red-300 dark:border-red-900/50 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 dark:border-[#22222e] focus:ring-orange-500/20 focus:border-orange-555"
                                    }`}
                                />
                            </div>
                            {errors.confirmPassword && (
                                <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    {errors.confirmPassword}
                                </span>
                            )}
                        </div>

                        {/* Sign Up Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {t.authRegistering}
                                </>
                            ) : (
                                t.authBtnSignUp
                            )}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="text-center text-sm text-gray-505 dark:text-gray-400 border-t border-gray-100 dark:border-[#22222e]/40 pt-5">
                        {t.authAlreadyHaveAccount}{" "}
                        <Link href="/login" className="text-orange-500 hover:text-orange-600 font-bold transition-colors">
                            {t.authSignInInstead}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
