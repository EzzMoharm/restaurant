// app/admin/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isUserAdmin } from "@/lib/supabase/admin";
import toast from "react-hot-toast";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ShieldAlert, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    // If user is already logged in and is an admin, send them directly to the admin panel
    useEffect(() => {
        async function checkCurrentSession() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && isUserAdmin(user)) {
                router.push("/admin");
            } else {
                setIsCheckingSession(false);
            }
        }
        checkCurrentSession();
    }, [router]);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) {
            return toast.error("Please enter both email and password.", {
                style: {
                    border: '1px solid #EF4444',
                    padding: '16px',
                    color: '#B91C1C',
                    fontWeight: 'bold',
                }
            });
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                const isAdmin = isUserAdmin(data.user);
                if (isAdmin) {
                    toast.success("Welcome back, Admin!", {
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
                    router.push("/admin");
                } else {
                    // Log out immediately if the user is not an admin
                    await supabase.auth.signOut();
                    toast.error("Access Denied: You do not have admin privileges.", {
                        style: {
                            border: '1px solid #F59E0B',
                            padding: '16px',
                            color: '#B45309',
                            fontWeight: 'bold',
                        },
                    });
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Authentication failed. Please check your credentials.";
            toast.error(errorMessage, {
                style: {
                    border: '1px solid #EF4444',
                    padding: '16px',
                    color: '#B91C1C',
                    fontWeight: 'bold',
                }
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (isCheckingSession) {
        return (
            <div className="min-h-[80vh] flex flex-col justify-center items-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Verifying credentials...</p>
            </div>
        );
    }

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 via-white to-gray-50 relative overflow-hidden">
            {/* Elegant glowing background circles for premium visual aesthetic */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Back to Home Link */}
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition-colors group">
                    <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex p-3 bg-orange-100 text-orange-600 rounded-2xl mb-2">
                            <Lock className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Admin Portal
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Access restricted to BiteFlow system administrators.
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email Address */}
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
                                    required
                                    placeholder="admin@biteflow.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-gray-700 block">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                                    <Lock className="w-5 h-5" />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Signing In...
                                </>
                            ) : (
                                "Sign In to Dashboard"
                            )}
                        </button>
                    </form>

                    {/* Safe Sandbox Warning */}
                    <div className="flex gap-2.5 p-4 bg-amber-50/60 border border-amber-100 rounded-2xl text-xs text-amber-800">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                        <div>
                            <span className="font-bold">Security Notice:</span> Access attempts are logged. If you do not have authorized credentials, please return to the main menu.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
