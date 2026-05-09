// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart";
import toast from "react-hot-toast";

// TypeScript interfaces for our data
interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string;
  image_url: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Bring in the Zustand cart action
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function fetchMenuData() {
      // Fetch categories and products simultaneously
      const [categoryRes, productRes] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("products").select("*"),
      ]);

      if (categoryRes.data) setCategories(categoryRes.data);
      if (productRes.data) setProducts(productRes.data);
      setIsLoading(false);
    }

    fetchMenuData();
  }, []);

  // Filter products based on the selected category pill
  const filteredProducts = activeCategory === "all"
    ? products
    : products.filter(p => p.category_id === activeCategory);

  if (isLoading) {
    return <div className="text-center py-20 text-xl font-semibold">Loading the menu...</div>;
  }

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto space-y-10">

      {/* Hero Section */}
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold text-gray-900">
          Crave it? <span className="text-orange-500">BiteFlow</span> it.
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Fresh ingredients, fast delivery, and a seamless ordering experience.
        </p>
      </header>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${activeCategory === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          All Menu
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${activeCategory === cat.id
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 py-10">
            No products found in this category.
          </p>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div
                className="h-48 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${product.image_url})` }}
              />

              {/* Product Details */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">
                    {product.name}
                  </h3>
                  <span className="font-bold text-green-600">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => {
                    addItem({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      quantity: 1
                    });
                    toast.success(`${product.name} added to cart!`, {
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
                  }}
                  className="w-full bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}