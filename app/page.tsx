// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart";
import { User } from "@supabase/supabase-js";
import { useTranslation, translateMenu } from "@/lib/translations";
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
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Bring in the Zustand cart action
  const setCustomizingProduct = useCartStore((state) => state.setCustomizingProduct);

  useEffect(() => {
    async function checkUserSession() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    checkUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    return (
      <div className="text-center py-20 text-xl font-semibold dark:text-gray-300">
        {lang === 'ar' ? 'جاري تحميل القائمة...' : 'Loading the menu...'}
      </div>
    );
  }

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto space-y-10">

      {/* Hero Section */}
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-gray-100">
          {lang === 'ar' ? (
            <>تشتهي طعاماً؟ <span className="text-orange-500">بايت فلو</span> يلبّيك.</>
          ) : (
            <>Crave it? <span className="text-orange-500">BiteFlow</span> it.</>
          )}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          {t.homeSubtitle}
        </p>
      </header>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-6 py-2 rounded-full font-medium transition-colors cursor-pointer ${
            activeCategory === "all"
              ? "bg-gray-900 text-white dark:bg-orange-500 dark:text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#1a1a24] dark:text-gray-300 dark:hover:bg-[#252536]"
          }`}
        >
          {t.categoryAll}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-6 py-2 rounded-full font-medium transition-colors cursor-pointer ${
              activeCategory === cat.id
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#1a1a24] dark:text-gray-300 dark:hover:bg-[#252536]"
            }`}
          >
            {translateMenu(cat.name, lang)}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
            {lang === 'ar' ? 'لم يتم العثور على أطباق في هذا القسم.' : 'No products found in this category.'}
          </p>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white dark:bg-[#121216]/90 dark:border-[#22222e] rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div
                className="h-48 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${product.image_url})` }}
              />

              {/* Product Details */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight">
                    {translateMenu(product.name, lang)}
                  </h3>
                  <span className="font-bold text-green-600 dark:text-green-400 shrink-0">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                 <button
                  onClick={() => {
                    if (!user) {
                      toast.error(
                        lang === 'ar'
                          ? "يرجى تسجيل الدخول لإضافة وجبات إلى سلتك."
                          : "Please sign in to add items to your cart.",
                        {
                          style: { border: '1px solid #F59E0B', padding: '16px', color: '#B45309', fontWeight: 'bold' }
                        }
                      );
                      router.push("/login");
                      return;
                    }

                    setCustomizingProduct(product);
                  }}
                  className="w-full bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white dark:bg-orange-950/40 dark:text-orange-400 dark:hover:bg-orange-500 dark:hover:text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  {t.btnCustomize}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}