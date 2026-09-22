import React, { useState, useEffect } from 'react';
import { CartItem } from '../types';
import { BRAND_INFO } from '../data/brandData';
import {
  X,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  createUpiOrder,
  redirectToUpiApp,
  savePendingPayment,
  clearPendingPayment,
  UpiOrderDetails,
} from '../services/paymentService';

interface CartOrderSheetProps {
  isOpen: boolean;
  cart: CartItem[];
  shopUpiId: string;
  onClose: () => void;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onClearCart: () => void;
  onPaymentCompleted: (order: {
    id: string;
    orderNumber: string;
    transactionId: string;
    items: CartItem[];
    total: number;
  }) => void;
}

type CheckoutPhase = 'CART' | 'PENDING' | 'CONFIRMED';

export const CartOrderSheet: React.FC<CartOrderSheetProps> = ({
  isOpen,
  cart,
  shopUpiId,
  onClose,
  onUpdateQuantity,
  onClearCart,
  onPaymentCompleted,
}) => {
  const [phase, setPhase] = useState<CheckoutPhase>('CART');
  const [activeOrder, setActiveOrder] = useState<UpiOrderDetails | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const totalPrice = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

  // Generate QR Code if requested or in pending phase
  useEffect(() => {
    if (activeOrder?.upiIntentUrl) {
      QRCode.toDataURL(activeOrder.upiIntentUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#080511',
          light: '#fdf8f4',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [activeOrder?.upiIntentUrl]);

  if (!isOpen) return null;

  // Handle Pay via UPI: Creates order and immediately redirects to UPI default app
  const handlePayViaUpi = () => {
    if (cart.length === 0 || totalPrice <= 0) return;

    setIsInitializing(true);
    setErrorMessage('');

    try {
      // 1. Generate client-side order with NPCI UPI URL Intent
      const order = createUpiOrder(cart, totalPrice, shopUpiId, BRAND_INFO.name);
      setActiveOrder(order);

      // Save pending payment for the 'return to page' experience
      savePendingPayment({
        ...order,
        cartItems: [...cart],
        createdAt: Date.now(),
      });

      setPhase('PENDING');

      // 2. Direct user immediately to their default UPI app
      redirectToUpiApp(order.upiIntentUrl);
    } catch (err: any) {
      console.error('Payment initialization error', err);
      setErrorMessage(err.message || 'Unable to open UPI app. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleManualOpenUpi = () => {
    if (activeOrder?.upiIntentUrl) {
      redirectToUpiApp(activeOrder.upiIntentUrl);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(shopUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCompleteAndReturnToMenu = () => {
    clearPendingPayment();
    if (activeOrder) {
      onPaymentCompleted({
        id: activeOrder.orderNumber || activeOrder.orderId,
        orderNumber: activeOrder.orderNumber || activeOrder.orderId,
        transactionId: activeOrder.transactionId,
        items: [...cart],
        total: activeOrder.amount,
      });
    }

    onClearCart();
    setPhase('CART');
    setActiveOrder(null);
    onClose();
  };

  const handleResetToCart = () => {
    clearPendingPayment();
    setPhase('CART');
    setActiveOrder(null);
    setErrorMessage('');
  };

  const handleCloseAndReset = () => {
    setPhase('CART');
    setActiveOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full sm:max-w-lg bg-[#110721] border border-purple-900/60 rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-900/40 flex items-center justify-between bg-[#150a29]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
            <h2 className="font-sans text-sm tracking-wider text-[#fdf8f4] uppercase font-bold">
              {phase === 'PENDING'
                ? 'UPI PAYMENT'
                : phase === 'CONFIRMED'
                ? 'ORDER CONFIRMED'
                : 'YOUR ORDER'}
            </h2>
          </div>

          <button
            onClick={handleCloseAndReset}
            className="w-8 h-8 rounded-full bg-[#1e0f38] border border-purple-800/60 flex items-center justify-center text-purple-200 hover:text-white hover:border-purple-400 transition-colors cursor-pointer"
            aria-label="Close sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* ======================================================== */}
          {/* SCREEN 1: REDIRECTED TO UPI APP & COUNTER DISPLAY        */}
          {/* ======================================================== */}
          {phase === 'PENDING' && (
            <div id="upi-pending-screen" className="py-2 text-center space-y-5 animate-fade-in">
              {/* Notification pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/90 border border-purple-600/60 text-xs font-sans text-amber-300">
                <Smartphone className="w-3.5 h-3.5 text-purple-300" />
                <span>Redirecting to your default UPI app...</span>
              </div>

              {/* Prominent Order Number Card */}
              <div className="py-4 px-3 bg-[#190a2b] border-2 border-purple-600/70 rounded-2xl shadow-lg">
                <div className="text-xs font-mono tracking-widest text-[#d8b4fe] uppercase mb-1">
                  YOUR ORDER NUMBER
                </div>
                <h2 className="font-mono text-4xl sm:text-5xl text-[#fdf8f4] font-black tracking-wider text-amber-300">
                  ORDER #{activeOrder?.orderNumber || activeOrder?.orderId}
                </h2>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                  ₹{activeOrder?.amount || totalPrice} TO PAY
                </div>
              </div>

              {/* Direct UPI App Trigger Button */}
              <div className="space-y-2">
                <button
                  id="open-upi-app-direct-btn"
                  onClick={handleManualOpenUpi}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-sans font-bold text-sm tracking-wide uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>OPEN UPI APP (GPAY, PHONEPE, PAYTM)</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <p className="text-xs font-sans text-[#c8b5de]">
                  Tap above if your UPI app did not open automatically.
                </p>
              </div>

              {/* Friendly Local Counter Instruction */}
              <div className="p-4 bg-purple-950/80 border border-purple-700/60 rounded-xl text-center">
                <p className="font-sans text-lg text-amber-300 font-bold mb-0.5">
                  बस हे counter वर दाखवा. 😄
                </p>
                <p className="font-mono text-xs text-purple-200 tracking-wider uppercase font-semibold">
                  SHOW ORDER NUMBER AT COUNTER
                </p>
                <p className="text-[11px] font-sans text-purple-300 mt-1">
                  Pay directly via UPI and show your order number when picking up drinks.
                </p>
              </div>

              {/* Optional UPI QR Code for scanning with another phone */}
              <div className="pt-2">
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="text-xs font-mono text-purple-300 hover:text-amber-300 underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQr ? 'Hide UPI QR Code' : 'Or scan QR code with another phone'}</span>
                </button>

                {showQr && qrDataUrl && (
                  <div className="mt-3 p-4 bg-[#180b2e] border border-purple-700/50 rounded-xl text-center space-y-2">
                    <div className="p-2 bg-white inline-block rounded-xl shadow-md">
                      <img src={qrDataUrl} alt="UPI QR Code" className="w-44 h-44 mx-auto" />
                    </div>
                    <div className="text-xs font-mono text-purple-200">
                      Amount: ₹{activeOrder?.amount || totalPrice} · UPI: {shopUpiId}
                    </div>
                  </div>
                )}
              </div>

              {/* Final Actions: Done & Back to Menu */}
              <div className="pt-3 border-t border-purple-900/40 flex flex-col gap-2.5">
                <button
                  id="done-back-to-menu-btn"
                  onClick={handleCompleteAndReturnToMenu}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-sans font-bold text-sm tracking-wide uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>✓ I'VE PAID · BACK TO MENU</span>
                </button>

                <button
                  onClick={handleResetToCart}
                  className="py-2.5 text-xs font-sans text-purple-300 hover:text-white transition-colors cursor-pointer"
                >
                  Change items or back to cart
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCREEN 2: CART SUMMARY & ITEMS LIST                      */}
          {/* ======================================================== */}
          {phase === 'CART' && (
            <>
              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="font-sans text-sm text-purple-300 font-medium">
                    Your order is empty
                  </p>
                  <p className="text-xs text-purple-400">
                    Add cold soda, cold coffee, or softy from the menu.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
                    <span className="text-xs font-sans text-purple-200 uppercase tracking-wider font-semibold">
                      Selected Items ({cart.reduce((s, i) => s + i.quantity, 0)})
                    </span>
                    <button
                      onClick={onClearCart}
                      className="text-xs font-sans text-purple-300 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>

                  {cart.map(({ item, quantity }) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-[#170a29] border border-purple-900/50 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans text-sm text-[#fdf8f4] font-medium truncate">
                          {item.name}
                        </h4>
                        <span className="text-xs font-sans text-purple-300">
                          ₹{item.price} each
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-purple-800/70 rounded-lg bg-[#0e061a]">
                          <button
                            onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-purple-200 hover:text-white hover:bg-purple-950/60 transition-colors cursor-pointer"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-mono text-sm text-[#fdf8f4]">
                            {quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-purple-200 hover:text-white hover:bg-purple-950/60 transition-colors cursor-pointer"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="font-mono text-sm text-amber-300 font-semibold w-12 text-right">
                          ₹{item.price * quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* UPI ID Quick Copy */}
              {cart.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={handleCopyUpi}
                    className="w-full py-2.5 px-3 bg-[#170a29] hover:bg-[#200f38] border border-purple-900/40 rounded-xl text-xs font-mono text-purple-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>UPI ID COPIED: {shopUpiId}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-purple-400" />
                        <span>COPY SHOP UPI ID: {shopUpiId}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-950/60 border border-red-800 text-xs text-red-200 rounded-xl">
                  {errorMessage}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Checkout Bar (Cart Phase Only) */}
        {phase === 'CART' && cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-[#150a29] border-t border-purple-900/50 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-sans tracking-wider text-purple-300 uppercase font-semibold">Total</span>
              <span className="font-mono text-2xl sm:text-3xl text-amber-300 font-bold">
                ₹{totalPrice}
              </span>
            </div>

            {/* Main [ PAY ₹... VIA UPI ] Action */}
            <button
              id="pay-via-upi-btn"
              onClick={handlePayViaUpi}
              disabled={isInitializing}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-sans font-bold text-sm tracking-wide uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-85"
            >
              {isInitializing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>OPENING UPI APP...</span>
                </>
              ) : (
                <>
                  <span>PAY ₹{totalPrice} VIA UPI</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-[11px] font-sans text-purple-300 text-center">
              Redirects to default UPI app (Google Pay, PhonePe, Paytm, etc.)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
