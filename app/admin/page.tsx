// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isUserAdmin } from "@/lib/supabase/admin";
import { User } from "@supabase/supabase-js";
import { ShieldX, LogOut, ArrowLeft, PlusCircle, LayoutDashboard, Layers, ShoppingBag, AlertCircle, Trash2, Truck, Calendar, RefreshCw } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    category_id: string;
    image_url: string;
    categories?: {
        name: string;
    } | null;
}

interface AdminOrderItem {
    id: string;
    quantity: number;
    price_at_time: number;
    product_id: string;
    products: {
        name: string;
    } | null;
}

interface AdminOrder {
    id: string;
    total_price: number;
    status: string;
    created_at: string;
    user_id: string | null;
    order_items: AdminOrderItem[];
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
import toast from "react-hot-toast";

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isAdminState, setIsAdminState] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryName, setCategoryName] = useState("");
    const [productName, setProductName] = useState("");
    const [price, setPrice] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const [products, setProducts] = useState<Product[]>([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isDeletingProduct, setIsDeletingProduct] = useState<string | null>(null);
    const [manageActiveCategory, setManageActiveCategory] = useState<string>("all");

    const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});
    const [productErrors, setProductErrors] = useState<Record<string, string>>({});

    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);

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
                    // If authorized admin, fetch dashboard categories and products
                    await fetchCategories();
                    await fetchProducts();
                    await fetchAllOrders();
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

    async function fetchProducts() {
        const { data, error } = await supabase
            .from("products")
            .select("*, categories(name)");

        if (error) {
            toast.error("Database Error: " + error.message, {
                style: { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C', fontWeight: 'bold' }
            });
            return;
        }

        if (data) {
            setProducts(data);
        }
    }

    async function fetchAllOrders() {
        setIsLoadingOrders(true);
        try {
            const { data, error } = await supabase
                .from("orders")
                .select(`
                    id,
                    total_price,
                    status,
                    created_at,
                    user_id,
                    order_items (
                        id,
                        quantity,
                        price_at_time,
                        product_id,
                        products (
                            name
                        )
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) {
                toast.error("Error loading orders: " + error.message);
            } else if (data) {
                setOrders((data as unknown as AdminOrder[]) || []);
            }
        } catch (err) {
            console.error("Fetch all orders error:", err);
            const errMsg = err instanceof Error ? err.message : "Error loading orders";
            toast.error(errMsg);
        } finally {
            setIsLoadingOrders(false);
        }
    }

    async function handleUpdateOrderStatus(orderId: string, newStatus: string) {
        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: newStatus })
                .eq("id", orderId);

            if (error) {
                toast.error("Fulfillment Error: " + error.message);
            } else {
                toast.success(`Fulfillment updated to: ${newStatus.toUpperCase()}`, {
                    style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
                });
                fetchAllOrders();
            }
        } catch (err) {
            console.error("Update status error:", err);
            const errMsg = err instanceof Error ? err.message : "Fulfillment error";
            toast.error(errMsg);
        }
    }

    async function handleDeleteProduct(id: string) {
        if (!confirm("Are you sure you want to delete this product?")) return;

        setIsDeletingProduct(id);

        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

        setIsDeletingProduct(null);

        if (error) {
            toast.error("Error deleting product: " + error.message, {
                style: { border: '1px solid #EF4444', padding: '16px', color: '#B91C1C' }
            });
        } else {
            fetchProducts();
            toast.success("Product deleted successfully!", {
                style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
            });
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
        if (imageUrl.trim() && !/^https?:\/\/.+/.test(imageUrl.trim())) {
            newErrors.imageUrl = "Please enter a valid image URL (e.g. http:// or https://).";
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

        const finalImageUrl = imageUrl.trim() || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500";

        const { error } = await supabase.from("products").insert([
            {
                name: productName.trim(),
                price: parseFloat(price),
                category_id: selectedCategory,
                image_url: finalImageUrl,
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
            setImageUrl("");
            fetchProducts();
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

    // Filter products for administrative management list
    const filteredManageProducts = manageActiveCategory === "all"
        ? products
        : products.filter((p) => p.category_id === manageActiveCategory);

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
                        <label className="text-xs font-semibold text-gray-500">Product Image URL (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. https://images.unsplash.com/photo-..."
                            className={`w-full border p-3.5 rounded-xl text-gray-900 focus:outline-none focus:ring-2 transition-all font-medium placeholder-gray-400 ${
                                productErrors.imageUrl
                                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                                    : "border-gray-200 focus:ring-orange-500/20 focus:border-orange-500"
                            }`}
                            value={imageUrl}
                            onChange={(e) => {
                                setImageUrl(e.target.value);
                                if (productErrors.imageUrl) setProductErrors(prev => ({ ...prev, imageUrl: "" }));
                            }}
                        />
                        {productErrors.imageUrl && (
                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {productErrors.imageUrl}
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

            {/* --- Manage Products Section --- */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    3. Manage & Delete Products
                </h2>

                {/* Category Pills Navigation Filter */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-100">
                        <button
                            onClick={() => setManageActiveCategory("all")}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                manageActiveCategory === "all"
                                    ? "bg-gray-900 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            All
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setManageActiveCategory(cat.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                    manageActiveCategory === cat.id
                                        ? "bg-orange-500 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}
                
                {products.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No products found in the menu.</p>
                ) : filteredManageProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No products found in this category.</p>
                ) : (
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
                        {filteredManageProducts.map((prod) => (
                            <div key={prod.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                                <div className="flex items-center gap-3 truncate">
                                    <div
                                        className="w-12 h-12 rounded-xl bg-cover bg-center shrink-0 border border-gray-100"
                                        style={{ backgroundImage: `url(${prod.image_url})` }}
                                    />
                                    <div className="truncate">
                                        <h4 className="font-bold text-sm text-gray-900 truncate">{prod.name}</h4>
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400" />
                                            {prod.categories?.name || "Uncategorized"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <span className="font-bold text-sm text-green-600">${prod.price.toFixed(2)}</span>
                                    <button
                                        onClick={() => handleDeleteProduct(prod.id)}
                                        disabled={isDeletingProduct === prod.id}
                                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all cursor-pointer disabled:opacity-50 border border-red-100/50 hover:border-red-200"
                                        title="Delete Product"
                                    >
                                        {isDeletingProduct === prod.id ? (
                                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* --- Manage & Fulfill Orders Section --- */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-50 pb-3">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-orange-500" />
                        4. Manage & Fulfill Orders
                    </h2>
                    <button
                        onClick={fetchAllOrders}
                        disabled={isLoadingOrders}
                        className="inline-flex items-center gap-1 bg-gray-50 hover:bg-orange-50 hover:text-orange-500 border border-gray-200/60 text-gray-500 px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                        Sync Orders
                    </button>
                </div>

                {isLoadingOrders && orders.length === 0 ? (
                    <div className="flex justify-center items-center py-10 space-y-2 flex-col">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-gray-400 font-semibold animate-pulse">Syncing orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No customer orders found in the database.</p>
                ) : (
                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-1 space-y-6">
                        {orders.map((order) => {
                            const orderRef = `BF-${order.id.substring(0, 5).toUpperCase()}`;
                            const dateFormatted = new Date(order.created_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            // Try to retrieve address metadata from shared localStorage origin
                            let metaData: OrderDeliveryMeta | null = null;
                            if (typeof window !== "undefined") {
                                const metaStr = localStorage.getItem(`biteflow-order-meta-${order.id}`);
                                if (metaStr) {
                                    metaData = JSON.parse(metaStr);
                                }
                            }

                            return (
                                <div key={order.id} className="pt-6 first:pt-0 space-y-3.5 text-left">
                                    {/* Order Meta Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-extrabold text-gray-800 tracking-wide">{orderRef}</span>
                                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {dateFormatted}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-medium truncate max-w-[280px]">
                                                Cust: <span className="font-semibold text-gray-600">{order.user_id || "Guest"}</span>
                                            </p>
                                        </div>

                                        {/* Dropdown status changer */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Status:</span>
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                className="border border-gray-200 text-xs font-bold py-1.5 px-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-white cursor-pointer"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="preparing">Preparing</option>
                                                <option value="ready">Ready</option>
                                                <option value="delivering">Delivering</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Order Receipt and Delivery row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                        {/* Left col: list items */}
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Items</span>
                                            <div className="bg-white rounded-xl border border-gray-100 p-3 divide-y divide-gray-50 space-y-1.5">
                                                {metaData && metaData.items ? (
                                                    metaData.items.map((metaItem: MetaItem, idx: number) => (
                                                        <div key={idx} className="py-2 first:pt-0 last:pb-0 text-left">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <span className="font-semibold text-gray-800">
                                                                    {metaItem.name} <span className="font-bold text-gray-500">x{metaItem.quantity}</span>
                                                                </span>
                                                                <span className="font-bold text-gray-900 shrink-0">${(metaItem.price * metaItem.quantity).toFixed(2)}</span>
                                                            </div>
                                                            {metaItem.customization && (
                                                                <div className="text-[10px] text-gray-400 font-semibold space-y-0.5 mt-0.5 pl-1.5 border-l border-orange-500/30">
                                                                    {metaItem.customization.size && (
                                                                        <p className="leading-tight">
                                                                            Portion: <span className="text-gray-600 font-bold">{metaItem.customization.size}</span>
                                                                        </p>
                                                                    )}
                                                                    {(metaItem.customization.addons && metaItem.customization.addons.length > 0) && (
                                                                        <p className="leading-tight">
                                                                            Add-ons: <span className="text-orange-500">{metaItem.customization.addons.join(", ")}</span>
                                                                        </p>
                                                                    )}
                                                                    {metaItem.customization.instructions && (
                                                                        <p className="italic text-gray-400 font-normal leading-tight">
                                                                            Note: &quot;{metaItem.customization.instructions}&quot;
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    order.order_items?.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0">
                                                            <span className="font-medium text-gray-700">
                                                                {item.products?.name || "Deleted Dish"} <span className="font-bold text-gray-500">x{item.quantity}</span>
                                                            </span>
                                                            <span className="font-bold text-gray-900">${(item.price_at_time * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))
                                                )}
                                                <div className="flex justify-between border-t border-gray-50 pt-2 font-extrabold text-orange-600 text-sm">
                                                    <span>Grand Total</span>
                                                    <span>${order.total_price.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right col: Delivery metadata details */}
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Delivery info</span>
                                            <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2 text-gray-600 font-medium">
                                                {metaData ? (
                                                    <>
                                                        <div>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Recipient Name</span>
                                                            <span className="text-gray-800 font-semibold text-xs">{metaData.fullName}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Recipient Destination</span>
                                                            <span className="text-gray-800 text-xs">{metaData.address}, {metaData.city}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Recipient Phone</span>
                                                                <span className="text-gray-800 text-xs">{metaData.phoneNumber}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Payment Method</span>
                                                                <span className="text-gray-800 text-xs uppercase font-bold">{metaData.paymentMethod}</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-gray-400 text-xs text-center py-6 italic font-normal">
                                                        No local metadata cache exists for this order. Showing placeholder defaults.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}