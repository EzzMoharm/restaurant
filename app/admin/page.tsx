// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isUserAdmin } from "@/lib/supabase/admin";
import { User } from "@supabase/supabase-js";
import { ShieldX, LogOut, ArrowLeft, PlusCircle, LayoutDashboard, Layers, ShoppingBag, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isAdminState, setIsAdminState] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryName, setCategoryName] = useState("");
    const [productName, setProductName] = useState("");
    const [price, setPrice] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);

    const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});
    const [productErrors, setProductErrors] = useState<Record<string, string>>({});

    // Run authentication and session check immediately
    useEffect(() => {
        async function checkSession() {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    // No session exists, redirect straight to admin login
                    router.push("/admin/login");
                    return;
                }

                const adminCheck = isUserAdmin(user);
                setUser(user);
                setIsAdminState(adminCheck);

                if (adminCheck) {
                    // If authorized admin, fetch dashboard categories
                    await fetchCategories();
                }
            } catch (err) {
                console.error("Auth validation error:", err);
                router.push("/admin/login");
            } finally {
                setAuthLoading(false);
            }
        }
        checkSession();

        // Subscribe to auth state updates to react instantly if they log out
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_OUT" || !session) {
                setUser(null);
                setIsAdminState(false);
                router.push("/admin/login");
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    async function fetchCategories() {
        const { data, error } = await supabase.from("categories").select("*");

        if (error) {
            toast.error("Database Error: " + error.message, {
                style: { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
            });
            return;
        }

        if (data && data.length > 0) {
            setCategories(data);
            setSelectedCategory(data[0].id);
        }
    }

    async function handleAddCategory() {
        setCategoryErrors({});
        if (!categoryName.trim()) {
            setCategoryErrors({ categoryName: "Please enter a category name." });
            toast.error("Please fill out all category fields.", {
                style: { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
            });
            return;
        }

        setIsAddingCategory(true);

        const slug = categoryName.toLowerCase().replace(/ /g, "-");
        const { error } = await supabase
            .from("categories")
            .insert([{ name: categoryName, slug }]);

        setIsAddingCategory(false);

        if (error) {
            toast.error("Error adding category: " + error.message, {
                style: { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C' }
            });
        } else {
            setCategoryName("");
            fetchCategories(); // Instantly refresh the dropdown
            toast.success("Category added successfully!", {
                style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
            });
        }
    }

    async function handleAddProduct() {
        setProductErrors({});
        const newErrors: Record<string, string> = {};

        if (!productName.trim()) {
            newErrors.productName = "Please enter a product name.";
        }
        if (!price.trim()) {
            newErrors.price = "Please enter a price.";
        } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            newErrors.price = "Please enter a valid price greater than 0.";
        }
        if (!selectedCategory) {
            newErrors.selectedCategory = "Please select a category.";
        }

        if (Object.keys(newErrors).length > 0) {
            setProductErrors(newErrors);
            toast.error("Please fill in all product fields correctly.", {
                style: { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
            });
            return;
        }

        setIsAddingProduct(true);

        const { error } = await supabase.from("products").insert([
            {
                name: productName.trim(),
                price: parseFloat(price),
                category_id: selectedCategory,
                image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500",
            },
        ]);

        setIsAddingProduct(false);

        if (error) {
            toast.error("Error adding product: " + error.message, {
                style: { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C' }
            });
        } else {
            setProductName("");
            setPrice("");
            toast.success("Product added successfully!", {
                style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
            });
        }
    }

    async function handleSignOut() {
        await supabase.auth.signOut();
        toast.success("Logged out successfully.", {
            style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
        });
        router.push("/");
    }

    // 1. Premium Loading State (Skeleton Loaders and Spinner)
    if (authLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 py-10 px-4">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center border-b pb-4 animate-pulse">
                    <div className="h-9 w-48 bg-gray-200 rounded-lg"></div>
                    <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                </div>
                {/* Form Card 1 Skeleton */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 space-y-4 animate-pulse">
                    <div className="h-6 w-32 bg-gray-200 rounded"></div>
                    <div className="flex gap-4">
                        <div className="h-12 bg-gray-200 rounded-lg flex-1"></div>
                        <div className="h-12 w-32 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
                {/* Form Card 2 Skeleton */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 space-y-4 animate-pulse">
                    <div className="h-6 w-40 bg-gray-200 rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-12 bg-gray-200 rounded-lg"></div>
                        <div className="h-12 bg-gray-200 rounded-lg"></div>
                        <div className="h-12 bg-gray-200 rounded-lg"></div>
                        <div className="h-12 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Premium "Access Denied" Screen for Non-Admin Logged In Users
    if (user && !isAdminState) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-br from-red-50 via-white to-gray-50 relative overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-100/60 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="max-w-md w-full text-center space-y-6 relative z-10 bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-red-100">
                    <div className="inline-flex p-4 bg-red-100 text-red-600 rounded-full animate-bounce">
                        <ShieldX className="w-12 h-12" />
                    </div>
                    
                    <div className="space-y-2">
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Access Restricted</h1>
                        <p className="text-gray-500 font-medium text-sm leading-relaxed">
                            Oops! The account <span className="font-semibold text-gray-700">{user.email}</span> does not have system administrator permissions.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                            onClick={() => router.push("/")}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-red-600/10 flex items-center justify-center gap-2 cursor-pointer text-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Render the Protected Dashboard if Authorized Admin
    return (
        <div className="max-w-4xl mx-auto space-y-8 py-10 px-4 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                        <LayoutDashboard className="w-8 h-8 text-orange-500" />
                        Admin Dashboard
                    </h1>
                    <p className="text-sm text-gray-500">
                        Manage menu categories, items, and platform data (Logged in as <span className="font-semibold text-gray-700">{user?.email}</span>)
                    </p>
                </div>
                <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-4 py-2 rounded-xl font-bold transition-all text-sm cursor-pointer border border-gray-200/50 hover:border-red-200"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>

            {/* --- Category Section --- */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-green-500" />
                    1. Add Category
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 items-start w-full">
                    <div className="flex-1 w-full space-y-1">
                        <input
                            type="text"
                            placeholder="e.g. Drinks, Pizzas, Desserts"
                            className={`border p-3.5 rounded-xl w-full text-gray-900 focus:outline-none focus:ring-2 transition-all font-medium placeholder-gray-400 ${
                                categoryErrors.categoryName
                                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-gray-200 focus:ring-green-500/20 focus:border-green-500"
                            }`}
                            value={categoryName}
                            onChange={(e) => {
                                setCategoryName(e.target.value);
                                if (categoryErrors.categoryName) setCategoryErrors(prev => ({ ...prev, categoryName: "" }));
                            }}
                        />
                        {categoryErrors.categoryName && (
                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {categoryErrors.categoryName}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleAddCategory}
                        disabled={isAddingCategory}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-green-600/10 cursor-pointer text-sm sm:text-base w-full sm:w-auto h-[54px] self-stretch sm:self-start shrink-0"
                    >
                        {isAddingCategory ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <PlusCircle className="w-4 h-4" />
                                Save Category
                            </>
                        )}
                    </button>
                </div>
            </section>

            {/* --- Product Section --- */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-orange-500" />
                    2. Add New Product
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Product Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Double Cheeseburger"
                            className={`w-full border p-3.5 rounded-xl text-gray-900 focus:outline-none focus:ring-2 transition-all font-medium placeholder-gray-400 ${
                                productErrors.productName
                                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                            }`}
                            value={productName}
                            onChange={(e) => {
                                setProductName(e.target.value);
                                if (productErrors.productName) setProductErrors(prev => ({ ...prev, productName: "" }));
                            }}
                        />
                        {productErrors.productName && (
                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {productErrors.productName}
                            </span>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Price (USD)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 12.50"
                            className={`w-full border p-3.5 rounded-xl text-gray-900 focus:outline-none focus:ring-2 transition-all font-medium placeholder-gray-400 ${
                                productErrors.price
                                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                            }`}
                            value={price}
                            onChange={(e) => {
                                setPrice(e.target.value);
                                if (productErrors.price) setProductErrors(prev => ({ ...prev, price: "" }));
                            }}
                        />
                        {productErrors.price && (
                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {productErrors.price}
                            </span>
                        )}
                    </div>

                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-semibold text-gray-500">Select Category</label>
                        <select
                            className={`w-full border p-3.5 rounded-xl text-gray-900 focus:outline-none focus:ring-2 transition-all font-medium bg-white ${
                                productErrors.selectedCategory
                                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                            }`}
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                if (productErrors.selectedCategory) setProductErrors(prev => ({ ...prev, selectedCategory: "" }));
                            }}
                        >
                            {categories.length === 0 ? (
                                <option value="">Loading categories...</option>
                            ) : (
                                categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))
                            )}
                        </select>
                        {productErrors.selectedCategory && (
                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {productErrors.selectedCategory}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleAddProduct}
                        disabled={isAddingProduct}
                        className="md:col-span-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-orange-600/10 cursor-pointer text-sm sm:text-base mt-2"
                    >
                        {isAddingProduct ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Adding Product...
                            </>
                        ) : (
                            <>
                                <PlusCircle className="w-4 h-4" />
                                Add Product to Menu
                            </>
                        )}
                    </button>
                </div>
            </section>
        </div>
    );
}