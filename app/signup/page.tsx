// app/signup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isUserAdmin } from "@/lib/supabase/admin";
import toast from "react-hot-toast";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, UserPlus, User as UserIcon, AlertCircle } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
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
        
        const newErrors: Record<string, string> = {};
        if (!username.trim()) newErrors.username = "Please enter a username.";
        if (!email.trim()) newErrors.email = "Please enter your email.";
        
        if (!password) {
            newErrors.password = "Please enter a password.";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters.";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password.";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill in all fields correctly.", {
                style: { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
            });
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username.trim(),
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Determine if they were automatically logged in (standard in dev or with email confirm off)
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session) {
                    toast.success("Welcome to BiteFlow! Account created successfully.", {
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
                    router.push("/");
                } else {
                    toast.success("Account created! Please check your email to verify your registration.", {
                        style: {
                            border: '1px solid #10B981',
                            padding: '16px',
                            color: '#047857',
                            fontWeight: 'bold',
                        },
                    });
                    router.push("/login");
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Registration failed. Please check your credentials.";
            toast.error(errorMessage, {
                style: { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (isCheckingSession) {
        return (
            <div className="min-h-[80vh] flex flex-col justify-center items-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Verifying session...</p>
            </div>
        );
    }

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 via-white to-gray-50 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Back Link */}
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition-colors group">
                    <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                    Back to Menu
                </Link>

                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex p-3 bg-orange-100 text-orange-600 rounded-2xl mb-2">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Create Account
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Join BiteFlow to start placing delicious orders.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSignup} noValidate className="space-y-5">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Username
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                                    <UserIcon className="w-5 h-5" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="e.g. foodlover123"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (errors.username) setErrors(prev => ({ ...prev, username: "" }));
                                    }}
                                    className={`block w-full pl-11 pr-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.username 
                                            ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
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
                            <label className="text-sm font-semibold text-gray-700 block">
                                Email Address
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                                    <Mail className="w-5 h-5" />
                                </span>
                                <input
                                    type="email"
                                    placeholder="yourname@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                                    }}
                                    className={`block w-full pl-11 pr-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.email 
                                            ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
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
                            <label className="text-sm font-semibold text-gray-700 block">
                                Password
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
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
                                    className={`block w-full pl-11 pr-11 py-3 border rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.password 
                                            ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
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
                            <label className="text-sm font-semibold text-gray-700 block">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                                    <Lock className="w-5 h-5" />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" }));
                                    }}
                                    className={`block w-full pl-11 pr-11 py-3 border rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                                        errors.confirmPassword 
                                            ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                                            : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
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
                                    Registering...
                                </>
                            ) : (
                                "Sign Up"
                            )}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="text-center text-sm text-gray-500 border-t border-gray-100 pt-5">
                        Already have an account?{" "}
                        <Link href="/login" className="text-orange-500 hover:text-orange-600 font-bold transition-colors">
                            Sign in instead
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
