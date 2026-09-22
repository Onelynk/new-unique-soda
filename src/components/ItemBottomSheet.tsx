import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';

interface ItemBottomSheetProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number) => void;
}

export const ItemBottomSheet: React.FC<ItemBottomSheetProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);

  // Reset quantity to 1 when a new item is selected
  useEffect(() => {
    if (item) {
      setQuantity(1);
    }
  }, [item]);

  if (!item) return null;

  const handleAdd = () => {
    onAddToCart(item, quantity);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#140922] border-t border-x border-purple-600/50 rounded-t-2xl p-6 sm:p-7 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle grab bar */}
        <div className="w-12 h-1.5 bg-purple-800/80 rounded-full mx-auto mb-4" />

        {/* Header row with Drink Name & Close */}
        <div className="flex items-start justify-between gap-4 pb-3">
          <div>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#fdf8f4] font-semibold tracking-wide">
              {item.name}
            </h3>
            <p className="text-xs sm:text-sm text-purple-200 font-sans mt-0.5">
              {item.subtitle || item.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#a79bbd] hover:text-white hover:bg-[#1f0e34] rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Price Display */}
        <div className="pt-2 pb-4 flex items-baseline justify-between border-b border-purple-900/40">
          <span className="text-xs font-mono tracking-widest text-[#a79bbd] uppercase">
            UNIT PRICE
          </span>
          <span className="font-mono text-2xl text-amber-300 font-bold">
            ₹{item.price}
          </span>
        </div>

        {/* Quantity Selector: [ − ]  1  [ + ] (Age-Friendly large touch targets) */}
        <div className="py-5 flex items-center justify-between">
          <span className="text-xs font-sans font-semibold tracking-wider text-[#d8b4fe] uppercase">
            HOW MANY?
          </span>

          <div className="flex items-center gap-2 bg-[#1b0d2d] border border-purple-700/60 p-1.5 rounded-xl shadow-inner">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center text-purple-200 hover:text-white hover:bg-purple-800/60 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="w-10 text-center font-mono text-lg font-bold text-[#fdf8f4]">
              {quantity}
            </span>

            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 flex items-center justify-center text-purple-200 hover:text-white hover:bg-purple-800/60 rounded-lg transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Total Price preview for multiple items */}
        {quantity > 1 && (
          <div className="pb-4 flex justify-between text-xs font-sans text-purple-300 font-medium">
            <span>Subtotal for {quantity} items:</span>
            <span className="font-mono text-[#fdf8f4] font-bold">₹{item.price * quantity}</span>
          </div>
        )}

        {/* [ ADD TO ORDER / SOLD OUT ] Button */}
        {item.available ? (
          <button
            id="sheet-add-to-order-btn"
            onClick={handleAdd}
            className="w-full min-h-[48px] py-3.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-sans font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ADD TO ORDER · ₹{item.price * quantity}</span>
          </button>
        ) : (
          <div
            id="sheet-sold-out-btn"
            className="w-full min-h-[48px] py-3.5 bg-zinc-850 border border-zinc-700/80 text-zinc-400 font-sans font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-not-allowed select-none"
          >
            <span>CURRENTLY SOLD OUT</span>
          </div>
        )}

        {/* Quick hint */}
        <p className="text-xs font-sans text-[#8d79a5] text-center mt-3">
          Tap outside to cancel and return to menu
        </p>
      </div>
    </div>
  );
};
