import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { Check, ArrowLeft, Receipt } from 'lucide-react';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  orderId: string;
  items: CartItem[];
  total: number;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  orderId,
  items,
  total,
  onClose,
}) => {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(15);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-[#12081f] border-2 border-purple-500/60 rounded-2xl p-6 sm:p-8 shadow-2xl text-center animate-slide-up relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warm ambient glow behind check */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Animated green/purple verified check badge */}
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-md">
          <Check className="w-9 h-9 text-emerald-300 stroke-[3]" />
        </div>

        {/* Section 13: ✓ PAYMENT SUCCESSFUL */}
        <h1 className="font-sans text-2xl sm:text-3xl text-[#fdf8f4] font-bold tracking-tight mb-1">
          ✓ PAYMENT COMPLETED
        </h1>
        <div className="text-xs font-sans text-purple-300 font-medium mb-5">
          Paid via UPI App
        </div>

        {/* Section 14: Extremely large, prominent Order Number */}
        <div className="py-4 px-3 bg-[#190a2b] border border-purple-700/60 rounded-xl mb-4 shadow-inner">
          <div className="text-xs font-mono tracking-widest text-[#d8b4fe] uppercase mb-1">
            YOUR ORDER NUMBER
          </div>
          <h2 className="font-mono text-4xl sm:text-5xl text-[#fdf8f4] font-black tracking-wider text-amber-300">
            ORDER #{orderId}
          </h2>
          <div className="text-lg sm:text-xl font-mono font-bold text-emerald-400 mt-1">
            ₹{total} PAID
          </div>
        </div>

        {/* Section 14: Friendly local instruction: बस हे counter वर दाखवा. 😄 */}
        <div className="p-3.5 bg-purple-950/80 border border-purple-700/60 rounded-xl mb-5 text-center">
          <p className="font-sans text-base sm:text-lg text-amber-300 font-bold mb-0.5">
            बस हे counter वर दाखवा. 😄
          </p>
          <p className="font-mono text-xs text-purple-200 tracking-wider uppercase font-semibold">
            SHOW ORDER NUMBER AT COUNTER
          </p>
        </div>

        {/* Items Breakdown Card */}
        <div className="p-4 bg-[#170a26] border border-purple-900/50 rounded-xl text-left mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#a79bbd] pb-2 border-b border-purple-900/40">
            <span className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-purple-400" />
              <span>ORDER RECEIPT</span>
            </span>
            <span className="text-emerald-400 font-bold">PAID</span>
          </div>

          <div className="space-y-1.5 text-xs font-sans">
            {items.map(({ item, quantity }) => (
              <div key={item.id} className="flex justify-between text-[#fdf8f4]">
                <span className="font-medium">{item.name} × {quantity}</span>
                <span className="font-mono text-purple-200">₹{item.price * quantity}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-purple-900/40 flex justify-between items-baseline font-mono">
            <span className="text-xs text-[#a79bbd]">TOTAL AMOUNT</span>
            <span className="text-base font-bold text-emerald-400">₹{total}</span>
          </div>
        </div>

        {/* [ BACK TO MENU ] Button */}
        <button
          id="confirmation-back-to-menu-btn"
          onClick={onClose}
          className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-sans font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO MENU ({countdown}s)</span>
        </button>

      </div>
    </div>
  );
};
