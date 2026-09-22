import React, { useState, useEffect } from 'react';
import { SHOP_NAME } from '../data/brandData';
import { getRuntimeMenuUrl } from '../utils/url';
import { X, Copy, Check, QrCode, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQr: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  onOpenQr,
}) => {
  const [copied, setCopied] = useState(false);
  const [menuUrl, setMenuUrl] = useState('');
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMenuUrl(getRuntimeMenuUrl());
      setCanNativeShare(typeof navigator !== 'undefined' && Boolean(navigator.share));
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

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: SHOP_NAME,
          text: `${SHOP_NAME}\nSoda • Cold Coffee • Softy\nExplore our digital menu:\n${menuUrl}`,
          url: menuUrl,
        });
      } catch (err) {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-[#07050d] border-t sm:border border-purple-500/40 rounded-t-xl sm:rounded-lg p-6 sm:p-7 shadow-[0_0_50px_rgba(147,51,234,0.25)] space-y-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe Bar */}
        <div className="w-10 h-1 bg-purple-900/60 rounded-full mx-auto sm:hidden -mt-1 mb-2" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#8c7e9f] hover:text-[#faf7fd] bg-[#140b22] rounded-xs border border-purple-900/40 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: SHARE MENU */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-[0.25em] text-[#d8b4fe] uppercase block">
            INVITE & SHARE
          </span>
          <h3 className="font-serif text-2xl text-[#faf7fd] font-normal tracking-wide uppercase">
            SHARE MENU
          </h3>
          <p className="text-xs font-mono text-[#a79bbd]">
            {SHOP_NAME} · Soda • Cold Coffee • Softy
          </p>
        </div>

        {/* Live URL Preview Box */}
        <div className="p-3.5 bg-[#0e0819] border border-purple-900/50 rounded-xs space-y-1 text-left">
          <span className="text-[9px] font-mono uppercase text-[#74668b] block">
            LIVE WEBSITE URL
          </span>
          <p className="text-xs font-mono text-[#d8b4fe] truncate select-all">
            {menuUrl || 'Loading URL...'}
          </p>
        </div>

        {/* Action Buttons: Native Share, Copy Link, Show QR */}
        <div className="space-y-2.5">
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-mono font-semibold text-xs tracking-wider uppercase rounded-xs transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(147,51,234,0.4)]"
            >
              <Share2 className="w-4 h-4" />
              <span>SHARE ON PHONE</span>
            </button>
          )}

          {/* COPY LINK with small inline confirmation */}
          <button
            onClick={handleCopyLink}
            className="w-full py-3 px-4 bg-[#140b24] hover:bg-[#1f1136] text-[#e9d5ff] hover:text-white border border-purple-900/60 rounded-xs text-xs font-mono font-medium tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">LINK COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#c084fc]" />
                <span>COPY LINK</span>
              </>
            )}
          </button>

          {/* SHOW QR */}
          <button
            onClick={() => {
              onClose();
              onOpenQr();
            }}
            className="w-full py-3 px-4 bg-[#140b24] hover:bg-[#1f1136] text-[#e9d5ff] hover:text-white border border-purple-900/60 rounded-xs text-xs font-mono font-medium tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4 text-[#c084fc]" />
            <span>SHOW QR</span>
          </button>
        </div>

        {/* Small Close text */}
        <button
          onClick={onClose}
          className="w-full text-center text-xs font-mono text-[#8c7e9f] hover:text-[#faf7fd] tracking-widest uppercase transition-colors pt-1"
        >
          [ CLOSE ]
        </button>
      </div>
    </div>
  );
};
