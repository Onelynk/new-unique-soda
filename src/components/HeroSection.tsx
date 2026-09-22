import React from 'react';
import { ArrowDown, Share2, QrCode } from 'lucide-react';
import { SHOP_NAME } from '../data/brandData';
import { MenuCategory } from '../types';

interface HeroSectionProps {
  onViewMenu: () => void;
  onSelectCategory?: (category: MenuCategory) => void;
  onShareMenu: () => void;
  onOpenQr: () => void;
  onOpenCard: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onViewMenu,
  onSelectCategory,
  onShareMenu,
  onOpenQr,
  onOpenCard,
}) => {
  const handlePickCategory = (cat: MenuCategory) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 py-12 sm:py-16 overflow-hidden purple-lounge-bg border-b border-purple-900/30">
      
      {/* Warm evening plum & purple ambient backlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative max-w-xl mx-auto flex flex-col items-center z-10">
        
        {/* Friendly Shop Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-5 rounded-full bg-[#1b0d2a]/90 border border-purple-800/40 text-xs font-mono tracking-widest text-[#d8b4fe] uppercase shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>OPEN TONIGHT · BEST ENJOYED COLD 🧊</span>
        </div>

        {/* Section 04: NEW UNIQUE COLD DRINKS */}
        <h1 className="font-serif text-4xl sm:text-6xl font-normal text-[#fdf8f4] tracking-wide leading-tight mb-2 uppercase">
          NEW UNIQUE <br />
          <span className="text-purple-300 font-medium">COLD DRINKS</span>
        </h1>

        {/* Friendly brand voice: Kya piyoge? 😄 */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl sm:text-3xl font-sans font-bold text-amber-300 drop-shadow-sm">
            Kya piyoge? 😄
          </span>
        </div>

        <p className="text-xs sm:text-sm font-mono text-[#bfa9d6] tracking-wider mb-6">
          Soda • Cold Coffee • Softy
        </p>

        {/* Three Simple Choices (Section 04) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full mb-8">
          {/* SODA */}
          <button
            onClick={() => handlePickCategory('soda')}
            className="p-3 sm:p-3.5 bg-[#170a25] hover:bg-[#231038] border border-purple-800/40 hover:border-purple-500/60 rounded-lg text-center transition-all group cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <div className="text-2xl sm:text-3xl mb-1 group-hover:scale-110 transition-transform">
              🫧
            </div>
            <div className="font-serif text-sm sm:text-base font-semibold text-[#fdf8f4] tracking-wider uppercase">
              SODA
            </div>
            <div className="text-[11px] font-sans text-purple-300 mt-0.5">
              Pick your flavour
            </div>
            <div className="text-[10px] font-mono text-[#8d79a5] mt-1">
              from ₹70
            </div>
          </button>

          {/* COLD COFFEE */}
          <button
            onClick={() => handlePickCategory('coffee')}
            className="p-3 sm:p-3.5 bg-[#170a25] hover:bg-[#231038] border border-purple-800/40 hover:border-purple-500/60 rounded-lg text-center transition-all group cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <div className="text-2xl sm:text-3xl mb-1 group-hover:scale-110 transition-transform">
              ☕
            </div>
            <div className="font-serif text-sm sm:text-base font-semibold text-[#fdf8f4] tracking-wider uppercase">
              COLD COFFEE
            </div>
            <div className="text-[11px] font-sans text-purple-300 mt-0.5">
              Our one & only
            </div>
            <div className="text-[10px] font-mono text-[#8d79a5] mt-1">
              ₹100
            </div>
          </button>

          {/* SOFTY */}
          <button
            onClick={() => handlePickCategory('softy')}
            className="p-3 sm:p-3.5 bg-[#170a25] hover:bg-[#231038] border border-purple-800/40 hover:border-purple-500/60 rounded-lg text-center transition-all group cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <div className="text-2xl sm:text-3xl mb-1 group-hover:scale-110 transition-transform">
              🍦
            </div>
            <div className="font-serif text-sm sm:text-base font-semibold text-[#fdf8f4] tracking-wider uppercase">
              SOFTY
            </div>
            <div className="text-[11px] font-sans text-purple-300 mt-0.5">
              Today's flavours
            </div>
            <div className="text-[10px] font-mono text-[#8d79a5] mt-1">
              from ₹60
            </div>
          </button>
        </div>

        {/* Appetizing, Realistic Drink Photography: Chilled glass with ice, condensation, bubbles */}
        <div className="relative w-64 sm:w-72 aspect-[4/5] rounded-xl overflow-hidden border border-purple-800/50 bg-[#12081d] shadow-xl shadow-purple-950/60 mb-7 group">
          <img
            src="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop"
            alt="Cold glass with crystal ice cubes, carbonation bubbles, condensation and fresh lime"
            className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />

          {/* Warm evening shadow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0717] via-transparent to-black/20 pointer-events-none" />

          {/* Small label inside photo */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-sans text-[#fdf8f4] bg-[#140a23]/90 backdrop-blur-md px-3 py-1.5 rounded-md border border-purple-700/40">
            <span>Freshly chilled. 🧊</span>
            <span className="text-amber-300 font-medium">Thanda pahije? 😄</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            id="hero-view-menu-btn"
            onClick={onViewMenu}
            className="w-full sm:w-auto px-7 py-3.5 bg-purple-600 hover:bg-purple-500 text-[#fdf8f4] font-sans font-semibold text-sm rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>VIEW MENU</span>
            <ArrowDown className="w-4 h-4" />
          </button>

          <button
            id="hero-share-menu-btn"
            onClick={onShareMenu}
            className="w-full sm:w-auto px-7 py-3.5 bg-[#1b0e2b] hover:bg-[#26133d] text-[#f3e8ff] border border-purple-800/60 font-sans font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-purple-400" />
            <span>SHARE MENU</span>
          </button>
        </div>

        {/* Small Friendly Subtext */}
        <div className="flex items-center gap-3 mt-4 text-xs font-sans text-[#a795be]">
          <button
            onClick={onOpenQr}
            className="hover:text-purple-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-purple-400" />
            <span>Scan QR</span>
          </button>
          <span>•</span>
          <button
            onClick={onOpenCard}
            className="hover:text-purple-300 transition-colors cursor-pointer"
          >
            📍 Location & Info
          </button>
        </div>

      </div>
    </section>
  );
};

