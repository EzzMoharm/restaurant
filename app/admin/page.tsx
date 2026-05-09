// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AdminPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [categoryName, setCategoryName] = useState("");
    const [productName, setProductName] = useState("");
    const [price, setPrice] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);

    // Fetch categories immediately when the page loads
    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        const { data, error } = await supabase.from("categories").select("*");

        if (error) {
            alert("Database Error: " + error.message);
            return;
        }

        if (data && data.length > 0) {
            setCategories(data);
            // Auto-select the first category so the dropdown is ready to go
            setSelectedCategory(data[0].id);
        }
    }

    async function handleAddCategory() {
        if (!categoryName) return alert("Please enter a category name");
        setIsAddingCategory(true);

        const slug = categoryName.toLowerCase().replace(/ /g, "-");
        const { error } = await supabase
            .from("categories")
            .insert([{ name: categoryName, slug }]);

        setIsAddingCategory(false);

        if (error) {
            alert("Error adding category: " + error.message);
        } else {
            setCategoryName("");
            fetchCategories(); // Instantly refresh the dropdown
            alert("Category added successfully!");
        }
    }

    async function handleAddProduct() {
        if (!productName || !price || !selectedCategory) {
            return alert("Please fill in all product fields");
        }
        setIsAddingProduct(true);

        const { error } = await supabase.from("products").insert([
            {
                name: productName,
                price: parseFloat(price),
                category_id: selectedCategory,
                image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500",
            },
        ]);

        setIsAddingProduct(false);

        if (error) {
            alert("Error adding product: " + error.message);
        } else {
            setProductName("");
            setPrice("");
            alert("Product added successfully!");
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-10 px-4">
            <h1 className="text-3xl font-bold border-b pb-4 text-gray-800">
                Admin Dashboard
            </h1>

            {/* --- Category Section --- */}
            <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">1. Add Category</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="e.g. Drinks, Pizzas"
                        className="border border-gray-300 p-3 rounded-lg flex-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                    />
                    <button
                        onClick={handleAddCategory}
                        disabled={isAddingCategory}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                        {isAddingCategory ? "Saving..." : "Save Category"}
                    </button>
                </div>
            </section>

            {/* --- Product Section --- */}
            <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">2. Add New Product</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Product Name (e.g. Double Cheeseburger)"
                        className="border border-gray-300 p-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Price (e.g. 12.50)"
                        className="border border-gray-300 p-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />

                    <select
                        className="border border-gray-300 p-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {categories.length === 0 ? (
                            <option value="">Loading categories...</option>
                        ) : (
                            categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))
                        )}
                    </select>

                    <button
                        onClick={handleAddProduct}
                        disabled={isAddingProduct}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                        {isAddingProduct ? "Adding..." : "Add Product to Menu"}
                    </button>
                </div>
            </section>
        </div>
    );
}