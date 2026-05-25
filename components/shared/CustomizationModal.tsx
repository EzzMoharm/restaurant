"use client";

import { useEffect, useState } from "react";
import { useCartStore, CartItem } from "@/store/cart";
import { X, Minus, Plus, Check, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";

export default function CustomizationModal() {
  const {
    customizingProduct,
    editingItem,
    setCustomizingProduct,
    setEditingItem,
    addItem,
    updateItem,
  } = useCartStore();

  // Local state for options
  const [selectedSize, setSelectedSize] = useState<string>("Medium");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [customQuantity, setCustomQuantity] = useState<number>(1);

  // Helper: static portions based on category
  function getSizeOptions(categoryName: string) {
    const cat = categoryName.toLowerCase();
    if (cat.includes("drink")) {
      return [
        { name: "Small", price: -0.50 },
        { name: "Medium", price: 0.00 },
        { name: "Large", price: 0.75 }
      ];
    } else if (cat.includes("dessert")) {
      return [
        { name: "Regular", price: 0.00 },
        { name: "Double Portion", price: 1.50 }
      ];
    } else {
      return [
        { name: "Small", price: -1.00 },
        { name: "Medium", price: 0.00 },
        { name: "Large", price: 2.00 }
      ];
    }
  }

  // Helper: static addons based on category
  function getAddonOptions(categoryName: string) {
    const cat = categoryName.toLowerCase();
    if (cat.includes("drink")) {
      return [
        { name: "Extra Ice", price: 0.00 },
        { name: "Lemon Slice", price: 0.25 },
        { name: "Mint Leaves", price: 0.35 }
      ];
    } else if (cat.includes("dessert")) {
      return [
        { name: "Whipped Cream", price: 0.50 },
        { name: "Chocolate Syrup", price: 0.75 },
        { name: "Scoop of Vanilla Ice Cream", price: 1.50 }
      ];
    } else {
      return [
        { name: "Extra Cheese", price: 1.00 },
        { name: "Bacon Strips", price: 1.50 },
        { name: "Jalapeños", price: 0.50 },
        { name: "Sautéed Mushrooms", price: 0.75 }
      ];
    }
  }

  // Effect to synchronize states asynchronously on modal load
  useEffect(() => {
    if (editingItem) {
      const cat = editingItem.customization?.categoryName || "Main";
      setTimeout(() => {
        setSelectedSize(editingItem.customization?.size || (cat.toLowerCase().includes("dessert") ? "Regular" : "Medium"));
        setSelectedAddons(editingItem.customization?.addons || []);
        setSpecialInstructions(editingItem.customization?.instructions || "");
        setCustomQuantity(editingItem.quantity || 1);
      }, 0);
    } else if (customizingProduct) {
      const cat = customizingProduct.categories?.name || customizingProduct.categoryName || "Main";
      setTimeout(() => {
        setSelectedSize(cat.toLowerCase().includes("dessert") ? "Regular" : "Medium");
        setSelectedAddons([]);
        setSpecialInstructions("");
        setCustomQuantity(1);
      }, 0);
    }
  }, [editingItem, customizingProduct]);

  if (!customizingProduct && !editingItem) return null;

  // Active target values
  const baseName = editingItem
    ? editingItem.customization?.baseName || editingItem.name.split(" (")[0]
    : customizingProduct?.name || "";

  const basePrice = editingItem
    ? editingItem.customization?.basePrice || 0
    : customizingProduct?.price || 0;

  const imageUrl = editingItem
    ? editingItem.customization?.image_url || ""
    : customizingProduct?.image_url || "";

  const categoryName = editingItem
    ? editingItem.customization?.categoryName || "Main"
    : customizingProduct?.categories?.name || customizingProduct?.categoryName || "Main";

  const sizeOptions = getSizeOptions(categoryName);
  const addonOptions = getAddonOptions(categoryName);

  function calculateCustomizedPrice() {
    let uPrice = basePrice;
    const chosenSizeOpt = sizeOptions.find(s => s.name === selectedSize);
    if (chosenSizeOpt) {
      uPrice += chosenSizeOpt.price;
    }
    selectedAddons.forEach(addonName => {
      const addon = addonOptions.find(a => a.name === addonName);
      if (addon) {
        uPrice += addon.price;
      }
    });
    return uPrice * customQuantity;
  }

  function handleSaveCustomization() {
    const chosenSizeOpt = sizeOptions.find(s => s.name === selectedSize);
    let finalUnitPrice = basePrice + (chosenSizeOpt?.price || 0);
    selectedAddons.forEach(addonName => {
      const addon = addonOptions.find(a => a.name === addonName);
      if (addon) {
        finalUnitPrice += addon.price;
      }
    });

    const addonsHash = selectedAddons.slice().sort().join("-");
    const cleanInstructions = specialInstructions.trim().replace(/[^a-zA-Z0-9]/g, "-").substring(0, 15);
    const prodId = editingItem ? editingItem.customization?.productId || editingItem.id.substring(0, 36) : customizingProduct?.id || "";
    const uniqueId = `${prodId}-${selectedSize}-${addonsHash || "none"}-${cleanInstructions || "none"}`;

    const displayName = `${baseName} (${selectedSize})`;

    const newItem: CartItem = {
      id: uniqueId,
      name: displayName,
      price: finalUnitPrice,
      quantity: customQuantity,
      customization: {
        productId: prodId,
        baseName,
        basePrice,
        image_url: imageUrl,
        categoryName,
        size: selectedSize,
        addons: selectedAddons,
        instructions: specialInstructions.trim()
      }
    };

    if (editingItem) {
      updateItem(editingItem.id, newItem);
      toast.success(`${baseName} customization updated!`, {
        style: { border: '1px solid #F59E0B', padding: '16px', color: '#B45309', fontWeight: 'bold' }
      });
    } else {
      addItem(newItem);
      toast.success(`${baseName} added to cart!`, {
        style: { border: '1px solid #10B981', padding: '16px', color: '#047857', fontWeight: 'bold' }
      });
    }

    // Reset store triggers
    setCustomizingProduct(null);
    setEditingItem(null);
  }

  function handleCloseModal() {
    setCustomizingProduct(null);
    setEditingItem(null);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl relative flex flex-col p-6 space-y-6 animate-scaleUp">
        {/* Close Button */}
        <button 
          onClick={handleCloseModal} 
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Meta Header */}
        <div className="flex items-start gap-4 pr-8">
          {imageUrl && (
            <div 
              className="w-20 h-20 bg-cover bg-center rounded-2xl border border-gray-100 shrink-0"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          )}
          <div className="space-y-1 text-left">
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
              {editingItem ? "Edit Customization" : "Customize Dish"}
            </span>
            <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{baseName}</h3>
            <p className="font-extrabold text-sm text-green-600">${basePrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Portion Size selection */}
        {sizeOptions.length > 0 && (
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-0.5">Select Portion Size</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sizeOptions.map((opt) => {
                const isSelected = selectedSize === opt.name;
                const priceLabel = opt.price === 0 ? "Included" : opt.price > 0 ? `+$${opt.price.toFixed(2)}` : `-$${Math.abs(opt.price).toFixed(2)}`;
                
                return (
                  <label 
                    key={opt.name}
                    className={`border p-3 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-50/20 font-bold' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="size" 
                      value={opt.name}
                      checked={isSelected}
                      onChange={() => setSelectedSize(opt.name)}
                      className="sr-only" 
                    />
                    <span className="text-sm text-gray-900">{opt.name}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 font-medium">{priceLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Toppings / Add-ons selections */}
        {addonOptions.length > 0 && (
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-0.5">Choose Toppings / Add-ons</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addonOptions.map((addon) => {
                const isChecked = selectedAddons.includes(addon.name);
                const handleToggleAddon = () => {
                  if (isChecked) {
                    setSelectedAddons(prev => prev.filter(a => a !== addon.name));
                  } else {
                    setSelectedAddons(prev => [...prev, addon.name]);
                  }
                };

                return (
                  <label 
                    key={addon.name}
                    onClick={handleToggleAddon}
                    className={`border p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                      isChecked 
                        ? 'border-orange-500 bg-orange-50/10 font-semibold' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        isChecked ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3px]" />}
                      </div>
                      <span className="text-xs text-gray-800">{addon.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">
                      {addon.price === 0 ? "Free" : `+$${addon.price.toFixed(2)}`}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        <div className="space-y-2 text-left">
          <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pl-0.5">Special Preparation Notes</h4>
          <textarea
            placeholder="e.g. No onions, extra hot, sauce on the side..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            maxLength={100}
            className="w-full border border-gray-200 p-3 rounded-2xl text-xs text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium min-h-[70px] resize-none"
          />
        </div>

        {/* Bottom actions Panel */}
        <div className="border-t border-gray-50 pt-4 flex items-center justify-between gap-4">
          {/* Quantity Counter */}
          <div className="flex items-center border border-gray-200 rounded-2xl p-1 bg-gray-50/50">
            <button 
              onClick={() => setCustomQuantity(prev => Math.max(1, prev - 1))}
              className="p-2 hover:bg-white rounded-xl text-gray-600 transition-colors cursor-pointer shrink-0"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center text-sm font-extrabold text-gray-900">{customQuantity}</span>
            <button 
              onClick={() => setCustomQuantity(prev => prev + 1)}
              className="p-2 hover:bg-white rounded-xl text-gray-600 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add / Save Button */}
          <button
            onClick={handleSaveCustomization}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm uppercase tracking-wider"
          >
            <ShoppingBag className="w-4 h-4" />
            {editingItem ? "Update Order" : "Add to Cart"} - ${calculateCustomizedPrice().toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
