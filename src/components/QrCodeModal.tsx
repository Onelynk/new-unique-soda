import React, { useState, useEffect } from 'react';
import { BRAND_INFO, SHOP_NAME } from '../data/brandData';
import { getRuntimeMenuUrl } from '../utils/url';
import { X, Download, Share2, Copy, Check, QrCode } from 'lucide-react';
import QRCodeLib from 'qrcode';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [menuUrl, setMenuUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const runtimeUrl = getRuntimeMenuUrl();
      setMenuUrl(runtimeUrl);

      // Generate dynamic QR directly from the current runtime deployed URL
      QRCodeLib.toDataURL(runtimeUrl, {
        width: 480,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0a0514', // Deep rich charcoal module
          light: '#ffffff', // Crisp white background for 100% optical phone camera scannability
        },
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error('Failed to generate runtime QR:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (menuUrl) {
      navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    const shareTitle = `${SHOP_NAME}`;
    const shareText = `${SHOP_NAME}\nSoda • Cold Coffee • Softy\nScan to open menu:\n${menuUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: menuUrl,
        });
      } catch (err) {
        // Share dismissed or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSaveQr = () => {
    if (!qrUrl) return;
    setIsSaving(true);
    try {
      const a = document.createElement('a');
      a.href = qrUrl;
      a.download = 'new-unique-cold-drinks-qr.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Download failed', e);
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-[#07050d] border-t sm:border border-purple-500/40 rounded-t-xl sm:rounded-lg p-6 sm:p-7 shadow-[0_0_60px_rgba(147,51,234,0.3)] text-center space-y-5 animate-slide-up max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe handle */}
        <div className="w-10 h-1 bg-purple-900/60 rounded-full mx-auto sm:hidden -mt-1 mb-2" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#8c7e9f] hover:text-[#faf7fd] bg-[#130b22] rounded-xs border border-purple-900/40 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: SCAN TO ORDER */}
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-mono tracking-[0.3em] text-[#d8b4fe] uppercase block">
            TABLE & GUEST EXPERIENCE
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl text-[#faf7fd] font-normal tracking-wide uppercase">
            SCAN TO ORDER
          </h3>
          <div className="w-12 h-[1px] bg-purple-500/50 mx-auto mt-2" />
        </div>

        {/* Dynamic White QR Code with Subtle Purple Glow */}
        <div className="relative mx-auto w-64 sm:w-72 aspect-square p-3 bg-white rounded-xs border border-purple-500/60 shadow-[0_0_35px_rgba(168,85,247,0.35)] flex items-center justify-center">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt={`${SHOP_NAME} Dynamic QR Code`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-purple-900">
              <QrCode className="w-12 h-12 animate-pulse" />
              <span className="text-xs font-mono">Generating dynamic QR...</span>
            </div>
          )}
        </div>

        {/* Brand Information */}
        <div className="space-y-1">
          <h4 className="font-serif text-lg sm:text-xl font-medium text-[#faf7fd] tracking-wider uppercase">
            {SHOP_NAME}
          </h4>
          <p className="text-xs font-mono tracking-[0.15em] text-[#c084fc] uppercase">
            Soda • Cold Coffee • Softy
          </p>
          <p className="text-xs font-mono text-[#8d7ca4] italic">
            Scan to open menu
          </p>
        </div>

        {/* Current Dynamic Deployed URL snippet */}
        <div className="px-3 py-2 bg-[#0e081a] border border-purple-950 rounded-xs flex items-center justify-between gap-2 text-left">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-mono text-[#74668b] uppercase block">
              LIVE CANONICAL URL
            </span>
            <span className="text-xs font-mono text-[#d8b4fe] truncate block">
              {menuUrl || 'Loading current URL...'}
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="p-1.5 text-[#9d8bb8] hover:text-white bg-[#170e28] rounded-2xs border border-purple-900/50 shrink-0 transition-colors"
            title="Copy URL"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {copied && (
          <div className="text-[11px] font-mono text-emerald-400 tracking-wider uppercase -mt-2 animate-fade-in">
            ✓ LINK COPIED
          </div>
        )}

        {/* Action Buttons: SAVE QR | SHARE LINK | CLOSE */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2.5">
            {/* SAVE QR */}
            <button
              onClick={handleSaveQr}
              disabled={!qrUrl || isSaving}
              className="py-3 px-3 bg-[#160d29] hover:bg-[#20123c] text-[#e9d5ff] hover:text-white border border-purple-800/60 font-mono font-medium text-xs tracking-wider uppercase rounded-xs transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isSaving ? 'SAVING...' : 'SAVE QR'}</span>
            </button>

            {/* SHARE LINK */}
            <button
              onClick={handleShareLink}
              className="py-3 px-3 bg-purple-600 hover:bg-purple-500 text-white font-mono font-semibold text-xs tracking-wider uppercase rounded-xs transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>SHARE LINK</span>
            </button>
          </div>

          {/* CLOSE */}
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[#8c7e9f] hover:text-[#faf7fd] font-mono text-xs tracking-[0.2em] uppercase transition-colors"
          >
            [ CLOSE ]
          </button>
        </div>
      </div>
    </div>
  );
};
