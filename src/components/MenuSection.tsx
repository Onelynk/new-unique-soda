import React, { useState, useEffect } from 'react';
import { MenuItem, MenuCategory } from '../types';
import { BRAND_INFO, SHOP_NAME } from '../data/brandData';
import { getRuntimeMenuUrl } from '../utils/url';
import { Plus, Check, Share2, QrCode, Copy, Navigation, MapPin } from 'lucide-react';
import QRCodeLib from 'qrcode';

interface MenuSectionProps {
  menuItems: MenuItem[];
  selectedItem: MenuItem | null;
  onSelectItem: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem, quantity: number) => void;
  onOpenQr: () => void;
  onShareMenu: () => void;
  activeCategory?: MenuCategory;
  onCategoryChange?: (category: MenuCategory) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  menuItems,
  selectedItem,
  onSelectItem,
  onAddToCart,
  onOpenQr,
  onShareMenu,
  activeCategory: controlledCategory,
  onCategoryChange,
}) => {
  const [internalCategory, setInternalCategory] = useState<MenuCategory>('soda');
  const activeCategory = controlledCategory || internalCategory;

  const setActiveCategory = (cat: MenuCategory) => {
    if (onCategoryChange) {
      onCategoryChange(cat);
    } else {
      setInternalCategory(cat);
    }
  };

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [menuUrl, setMenuUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const runtimeUrl = getRuntimeMenuUrl();
      setMenuUrl(runtimeUrl);

      // Generate dynamic QR for the menu section from runtime URL
      QRCodeLib.toDataURL(runtimeUrl, {
        width: 360,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#11071d',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Menu section QR error:', err));
    }
  }, []);

  const handleCopyLink = () => {
    if (menuUrl) {
      navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Quick Direct Add to Cart with gentle visual tick
  const handleQuickAdd = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(item, 1);
    } else {
      onSelectItem(item);
    }

    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1200);
  };

  // Filter items for the active category
  const categoryItems = menuItems.filter((item) => item.category === activeCategory);

  return (
    <section id="menu" className="relative py-12 sm:py-16 px-4 sm:px-6 bg-[#0a0712] border-b border-purple-900/30">
      <div className="max-w-3xl mx-auto">
        
        {/* Physical Menu Board Inspired Heading */}
        <div className="text-center mb-7">
          <span className="text-xs font-mono tracking-widest text-amber-300 uppercase block mb-1">
            AAJ KYA HOGA? 👀
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#fdf8f4] tracking-wide font-normal uppercase">
            OUR MENU
          </h2>
          <p className="text-xs font-sans text-[#a795be] mt-1">
            Freshly prepared · Ice cold · Served with smile
          </p>
          <div className="w-16 h-[2px] bg-purple-500/40 mx-auto mt-3" />
        </div>

        {/* 3 Clear Category Tabs: SODA | COLD COFFEE | SOFTY */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#140921] border border-purple-800/40 rounded-xl mb-8 max-w-xl mx-auto shadow-inner">
          <button
            onClick={() => setActiveCategory('soda')}
            className={`py-3 px-2 text-center text-xs sm:text-sm font-sans font-semibold tracking-wide rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
              activeCategory === 'soda'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-[#a795be] hover:text-[#fdf8f4] hover:bg-[#1f0e33]'
            }`}
          >
            <span>🫧</span>
            <span>SODA</span>
          </button>

          <button
            onClick={() => setActiveCategory('coffee')}
            className={`py-3 px-2 text-center text-xs sm:text-sm font-sans font-semibold tracking-wide rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
              activeCategory === 'coffee'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-[#a795be] hover:text-[#fdf8f4] hover:bg-[#1f0e33]'
            }`}
          >
            <span>☕</span>
            <span>COLD COFFEE</span>
          </button>

          <button
            onClick={() => setActiveCategory('softy')}
            className={`py-3 px-2 text-center text-xs sm:text-sm font-sans font-semibold tracking-wide rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
              activeCategory === 'softy'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-[#a795be] hover:text-[#fdf8f4] hover:bg-[#1f0e33]'
            }`}
          >
            <span>🍦</span>
            <span>SOFTY</span>
          </button>
        </div>

        {/* Category Header Banner with Specific Friendly Copy */}
        <div className="mb-6 p-4 bg-[#140922] border border-purple-800/40 rounded-xl flex items-center justify-between">
          <div>
            {activeCategory === 'soda' && (
              <>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#fdf8f4] font-medium tracking-wide">
                  SODA
                </h3>
                <p className="text-xs sm:text-sm font-sans text-purple-300 font-medium mt-0.5">
                  Apna flavour choose karo.
                </p>
              </>
            )}

            {activeCategory === 'coffee' && (
              <>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#fdf8f4] font-medium tracking-wide">
                  COLD COFFEE
                </h3>
                <p className="text-xs sm:text-sm font-sans text-purple-300 font-medium mt-0.5">
                  Ek hi hai. Par mast hai. ☕
                </p>
              </>
            )}

            {activeCategory === 'softy' && (
              <>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#fdf8f4] font-medium tracking-wide">
                  SOFTY
                </h3>
                <p className="text-xs sm:text-sm font-sans text-purple-300 font-medium mt-0.5">
                  Aaj konata flavour available aahe?
                </p>
              </>
            )}
          </div>

          <span className="text-[11px] font-mono text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded-full">
            {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'flavours'}
          </span>
        </div>

        {/* Clean, Age-Friendly Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mb-6">
          {categoryItems.map((item) => {
            const isAdded = Boolean(addedItemIds[item.id]);

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group p-4 bg-[#140922] hover:bg-[#1d0d30] border border-purple-900/40 hover:border-purple-600/60 rounded-xl transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm"
              >
                <div>
                  {/* Top row: Name & Price */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="font-serif text-lg sm:text-xl text-[#fdf8f4] font-medium tracking-wide group-hover:text-purple-200 transition-colors">
                      {item.name}
                    </h4>
                    <span className="font-mono text-lg sm:text-xl text-[#fdf8f4] font-bold shrink-0 text-amber-300">
                      ₹{item.price}
                    </span>
                  </div>

                  {/* Subtitle (e.g. Crisp • Chilled • Fizzy) */}
                  <p className="text-xs sm:text-sm font-sans text-purple-200 font-medium mb-1">
                    {item.subtitle}
                  </p>

                  {/* Small description */}
                  {item.description && (
                    <p className="text-xs font-sans text-[#a795be] line-clamp-2 leading-relaxed mb-3">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Bottom row: Badge + Large Friendly [ + ADD ] or [ SOLD OUT ] button */}
                <div className="flex items-center justify-between pt-2 border-t border-purple-900/30">
                  <div className="text-[10px] font-mono text-[#8d79a5] uppercase tracking-wider">
                    {!item.available ? (
                      <span className="px-2 py-0.5 bg-red-950/80 border border-red-800/60 text-red-300 rounded-full font-semibold">
                        UNAVAILABLE
                      </span>
                    ) : item.badge ? (
                      <span className="px-2 py-0.5 bg-purple-950 border border-purple-800/60 text-purple-300 rounded-full">
                        {item.badge}
                      </span>
                    ) : (
                      <span>SERVED COLD</span>
                    )}
                  </div>

                  {item.available ? (
                    <button
                      onClick={(e) => handleQuickAdd(e, item)}
                      className={`min-h-[42px] px-4 py-2 rounded-lg font-sans text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        isAdded
                          ? 'bg-emerald-600 text-white scale-105'
                          : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95'
                      }`}
                      title={`Add ${item.name} to order`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4 text-white animate-scale-up" />
                          <span>ADDED</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>+ ADD</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="min-h-[42px] px-3.5 py-2 rounded-lg font-mono text-[11px] font-bold tracking-wider uppercase bg-zinc-900/90 border border-zinc-700/60 text-zinc-400 select-none flex items-center justify-center shadow-inner">
                      SOLD OUT
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Small note for Softy as requested */}
        {activeCategory === 'softy' && (
          <div className="p-3 bg-[#170a25] border border-purple-900/40 rounded-lg text-center text-xs font-sans text-[#bfa9d6] mb-8">
            <span className="font-semibold text-amber-300">टीप:</span> Flavours availability pramane change hou shaktat.
          </div>
        )}

        {/* Small local craft details */}
        <div className="my-8 text-center text-xs font-sans text-[#8d79a5] flex items-center justify-center gap-4">
          <span>Freshly chilled.</span>
          <span>•</span>
          <span>Best enjoyed cold. 🧊</span>
          <span>•</span>
          <span>Aajcha favourite?</span>
        </div>

        {/* ── SECTION 15: LOCATION (कुठे आहोत?) ── */}
        <div className="mt-12 p-6 bg-[#140922] border border-purple-800/40 rounded-xl text-center shadow-md">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/70 border border-purple-800/50 rounded-full text-xs font-sans text-purple-300 mb-2">
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>📍 कुठे आहोत?</span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl text-[#fdf8f4] font-medium tracking-wide uppercase">
            {BRAND_INFO.name}
          </h3>

          <p className="text-xs sm:text-sm font-sans text-[#c8b5de] mt-1 max-w-md mx-auto">
            {BRAND_INFO.address}, {BRAND_INFO.city}
          </p>

          <div className="mt-4">
            <a
              href={BRAND_INFO.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-sans font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-md active:scale-98"
            >
              <Navigation className="w-4 h-4" />
              <span>GET DIRECTIONS →</span>
            </a>
          </div>
        </div>

        {/* ── SECTION 16 & 17: SHARE & QR SECTION ── */}
        <div className="mt-8 p-6 bg-[#12081f] border border-purple-800/50 rounded-xl text-center shadow-md">
          <div className="space-y-1 mb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-sans text-amber-300">
              <Share2 className="w-3.5 h-3.5" />
              <span>Friend ला पण पाठवा 😄</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#fdf8f4] font-normal tracking-wide uppercase">
              ↗ SHARE MENU
            </h3>
          </div>

          {/* Dynamically Generated QR Code (Section 17: Scan करा आणि menu उघडा) */}
          <div
            onClick={onOpenQr}
            className="relative mx-auto w-48 sm:w-52 aspect-square p-2.5 bg-white rounded-lg border-2 border-purple-400 shadow-md flex items-center justify-center cursor-pointer group hover:scale-[1.02] transition-transform"
            title="Tap to enlarge QR code"
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`${SHOP_NAME} Dynamic QR Code`}
                className="w-full h-full object-contain"
              />
            ) : (
              <QrCode className="w-12 h-12 text-purple-950 animate-pulse" />
            )}
            
            <div className="absolute inset-0 bg-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
              <span className="text-xs font-sans bg-[#0a0712]/90 text-purple-200 px-3 py-1.5 rounded border border-purple-500/40 uppercase tracking-wider">
                Full Screen
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <p className="font-sans text-sm font-semibold text-[#fdf8f4]">
              Scan करा आणि menu उघडा.
            </p>
            <p className="text-xs font-sans text-[#a795be]">
              {SHOP_NAME} · Soda • Cold Coffee • Softy
            </p>
          </div>

          {/* Action Buttons: Native Share + Copy Link */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 max-w-sm mx-auto">
            <button
              onClick={onShareMenu}
              className="py-3 px-3 bg-purple-600 hover:bg-purple-500 text-white font-sans font-semibold text-xs tracking-wider uppercase rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              <span>SHARE MENU</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="py-3 px-3 bg-[#190c29] hover:bg-[#25123d] border border-purple-800/60 text-[#d8b4fe] hover:text-white font-sans font-semibold text-xs tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>COPY LINK</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
