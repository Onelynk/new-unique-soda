import React, { useState, useEffect } from 'react';
import { PendingPayment } from '../services/paymentService';
import {
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Copy,
  Check,
  QrCode,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import QRCode from 'qrcode';

interface ManualPaymentConfirmationModalProps {
  isOpen: boolean;
  pendingPayment: PendingPayment | null;
  shopUpiId?: string;
  onConfirm: () => void;
  onReopenUpi: () => void;
  onCancel: () => void;
}

export const ManualPaymentConfirmationModal: React.FC<ManualPaymentConfirmationModalProps> = ({
  isOpen,
  pendingPayment,
  shopUpiId,
  onConfirm,
  onReopenUpi,
  onCancel,
}) => {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const targetUpiId =
    shopUpiId || pendingPayment?.merchantUpiId || 'newuniquecolddrinks@okaxis';

  // Generate QR code for paying with another device
  useEffect(() => {
    if (pendingPayment?.upiIntentUrl) {
      QRCode.toDataURL(pendingPayment.upiIntentUrl, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0a0514',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate UPI QR code', err));
    }
  }, [pendingPayment?.upiIntentUrl]);

  if (!isOpen || !pendingPayment) return null;

  const totalItemsCount = pendingPayment.items.reduce((sum, it) => sum + it.quantity, 0);

  const handleCopyUpiId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(targetUpiId);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2500);
    }
  };

  return (
    <div
      id="manual-payment-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in"
    >
      <div
        id="manual-payment-modal-content"
        className="w-full max-w-md bg-[#12081f] border-2 border-purple-500/70 rounded-2xl p-5 sm:p-7 shadow-2xl text-center animate-slide-up relative overflow-y-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft background ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />

        {/* Floating subtle 'Copied!' toast message */}
        {showToast && (
          <div
            id="upi-copied-toast"
            className="fixed sm:absolute top-5 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-emerald-950/95 border border-emerald-500/80 text-xs font-mono text-emerald-300 shadow-2xl flex items-center gap-2 animate-fade-in pointer-events-none backdrop-blur-sm"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Copied UPI ID to clipboard!</span>
          </div>
        )}

        {/* Smartphone / Return Icon Badge */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-950/90 border-2 border-purple-400 flex items-center justify-center mx-auto mb-3 shadow-md">
          <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
        </div>

        {/* Friendly Greeting & Question */}
        <div className="inline-block px-3 py-1 rounded-full bg-purple-900/60 border border-purple-700/60 text-[11px] font-mono tracking-wider text-purple-200 uppercase mb-2">
          WELCOME BACK
        </div>
        <h2 className="font-sans text-2xl sm:text-3xl text-[#fdf8f4] font-bold tracking-tight mb-1">
          Did you complete payment?
        </h2>
        <p className="text-xs sm:text-sm font-sans text-purple-200/90 max-w-xs mx-auto mb-4">
          Please confirm if your UPI transaction in Google Pay, PhonePe, or Paytm was successful.
        </p>

        {/* Order Details Highlight */}
        <div className="py-3.5 px-4 bg-[#190a2b] border border-purple-700/60 rounded-xl mb-3.5 text-center shadow-inner">
          <div className="text-[11px] font-mono tracking-widest text-[#d8b4fe] uppercase mb-0.5">
            YOUR ORDER
          </div>
          <div className="font-mono text-3xl sm:text-4xl text-amber-300 font-black tracking-wider">
            ORDER #{pendingPayment.orderNumber || pendingPayment.orderId}
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
            ₹{pendingPayment.amount} · {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
          </div>

          {/* Quick item breakdown */}
          <div className="mt-2.5 pt-2 border-t border-purple-900/50 flex flex-wrap justify-center gap-1.5 text-[11px] font-sans text-purple-200">
            {pendingPayment.items.map((it) => (
              <span
                key={it.id}
                className="px-2 py-0.5 rounded-md bg-[#25103d] border border-purple-800/50"
              >
                {it.name} × {it.quantity}
              </span>
            ))}
          </div>
        </div>

        {/* Copy UPI ID Action with subtle feedback */}
        <div className="mb-3.5 space-y-1">
          <button
            id="copy-shop-upi-btn"
            onClick={handleCopyUpiId}
            className="w-full py-2.5 px-3 bg-[#190a2b] hover:bg-[#230e3d] active:bg-[#2d124f] border border-purple-700/60 hover:border-purple-500 rounded-xl text-xs font-mono text-purple-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold tracking-wide">
                  COPIED: {targetUpiId}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  COPY SHOP UPI ID: <strong className="text-amber-300 font-semibold">{targetUpiId}</strong>
                </span>
              </>
            )}
          </button>
          <p className="text-[10px] font-sans text-purple-300/80">
            Use this UPI address if paying manually via any payment app
          </p>
        </div>

        {/* Pay with another phone? Show QR Code section */}
        <div className="mb-4">
          <button
            id="toggle-pay-another-phone-qr-btn"
            onClick={() => setShowQr(!showQr)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/70 border border-purple-800/60 text-xs font-mono text-purple-200 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-300" />
            <span>{showQr ? 'Hide QR Code' : 'Pay with another phone? Show QR'}</span>
            {showQr ? (
              <ChevronUp className="w-3 h-3 text-purple-400 ml-0.5" />
            ) : (
              <ChevronDown className="w-3 h-3 text-purple-400 ml-0.5" />
            )}
          </button>

          {showQr && qrDataUrl && (
            <div className="mt-2.5 p-4 bg-[#190a2b] border border-purple-700/60 rounded-xl text-center space-y-2 animate-fade-in shadow-lg">
              <div className="p-3 bg-white inline-block rounded-xl shadow-md">
                <img
                  src={qrDataUrl}
                  alt={`UPI QR Code for Order ${pendingPayment.orderNumber}`}
                  className="w-44 h-44 sm:w-48 sm:h-48 mx-auto"
                />
              </div>
              <div className="text-xs font-sans text-purple-200 font-medium">
                Scan with Google Pay, PhonePe, Paytm or BHIM on another phone
              </div>
              <div className="text-[11px] font-mono text-amber-300">
                Amount: ₹{pendingPayment.amount} · UPI: {targetUpiId}
              </div>
            </div>
          )}
        </div>

        {/* Marathi instruction hint */}
        <div className="p-3 bg-purple-950/70 border border-purple-800/50 rounded-xl mb-4 text-center">
          <p className="font-sans text-sm text-amber-300 font-semibold mb-0.5">
            पेमेंट झाले असल्यास खालील बटण दाबा.
          </p>
          <p className="text-[11px] font-sans text-purple-300">
            If payment is done, confirm below to get your token for pickup at counter.
          </p>
        </div>

        {/* Primary & Secondary Actions */}
        <div className="space-y-2.5">
          {/* Main Confirmation: YES, I'VE PAID */}
          <button
            id="confirm-manual-payment-btn"
            onClick={onConfirm}
            className="w-full py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-sans font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>✓ YES, PAYMENT COMPLETED</span>
          </button>

          {/* Re-open UPI App in case user didn't complete it */}
          <button
            id="reopen-upi-app-btn"
            onClick={onReopenUpi}
            className="w-full py-3 bg-[#1e0f38] hover:bg-[#28144a] border border-purple-700/60 text-purple-200 hover:text-white font-sans font-semibold text-xs tracking-wide uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-amber-300" />
            <span>REOPEN UPI APP (GPAY, PHONEPE)</span>
          </button>

          {/* Cancel or didn't pay */}
          <button
            id="cancel-manual-payment-btn"
            onClick={onCancel}
            className="py-2 text-xs font-sans text-purple-300 hover:text-red-400 transition-colors cursor-pointer"
          >
            I didn't complete payment / Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
