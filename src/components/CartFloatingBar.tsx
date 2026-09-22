import React from 'react';
import { CartItem } from '../types';
import { ArrowRight, ShoppingBag } from 'lucide-react';

interface CartFloatingBarProps {
  cart: CartItem[];
  onOpenOrder: () => void;
}

export const CartFloatingBar: React.FC<CartFloatingBarProps> = ({
  cart,
  onOpenOrder,
}) => {
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

  if (totalQuantity === 0) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none animate-slide-up">
      <div className="w-full max-w-md bg-[#160a26]/95 backdrop-blur-md border border-purple-600/60 rounded-xl p-3 shadow-2xl flex items-center justify-between pointer-events-auto">
        
        {/* Left: Summary */}
        <div className="flex items-center gap-3 pl-1.5">
          <div className="w-9 h-9 rounded-lg bg-purple-900/70 border border-purple-700/60 flex items-center justify-center text-purple-200 shadow-sm">
            <ShoppingBag className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-mono font-bold text-[#fdf8f4]">
              {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} · <span className="text-amber-300">₹{totalPrice}</span>
            </div>
            <div className="text-[11px] font-sans text-purple-300 font-medium">
              Tap to view order & UPI pay
            </div>
          </div>
        </div>

        {/* Right: [ VIEW ORDER ] Button */}
        <button
          id="floating-view-order-btn"
          onClick={onOpenOrder}
          className="min-h-[44px] px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-sans font-semibold text-xs sm:text-sm tracking-wider uppercase rounded-lg transition-all shadow-md flex items-center gap-1.5 active:scale-97 cursor-pointer"
        >
          <span>VIEW ORDER</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
