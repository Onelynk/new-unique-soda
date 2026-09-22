import React from 'react';
import { BRAND_INFO } from '../data/brandData';
import { MainTab } from '../types';
import { QrCode, Share2 } from 'lucide-react';

interface NavbarProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenQr: () => void;
  isManagerOpen?: boolean;
  onShare: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQr,
  isManagerOpen = false,
  onShare,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a0712]/95 backdrop-blur-md border-b border-purple-900/30 transition-all duration-200">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand identity */}
        <button
          onClick={() => onSelectTab('menu')}
          className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer min-w-0 shrink"
          title={`${BRAND_INFO.name} - Menu`}
        >
          {/* Icon button with smooth pulse animation when shop manager is closed */}
          <div
            className={`relative w-8 h-8 rounded-lg bg-[#1a0c2c] border flex items-center justify-center text-amber-300 font-serif font-bold text-lg transition-all shadow-sm shrink-0 ${
              !isManagerOpen
                ? 'animate-smooth-pulse border-purple-500/80 group-hover:border-amber-400'
                : 'border-purple-600/50 group-hover:border-purple-400'
            }`}
          >
            N
            {!isManagerOpen && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
            )}
          </div>
          <div className="min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-sm xs:text-base sm:text-lg md:text-xl text-[#fdf8f4] font-medium tracking-wide group-hover:text-purple-200 transition-colors uppercase truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[260px] md:max-w-none block">
                {BRAND_INFO.name}
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-purple-300 font-sans font-medium -mt-0.5 truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
              Soda • Cold Coffee • Softy
            </p>
          </div>
        </button>

        {/* Primary Simple Navigation: MENU | CARD */}
        <nav className="flex items-center p-1 bg-[#140922] border border-purple-800/40 rounded-lg">
          <button
            id="nav-tab-menu"
            onClick={() => onSelectTab('menu')}
            className={`px-4 py-1.5 text-xs font-sans font-semibold tracking-wide uppercase rounded-md transition-all cursor-pointer ${
              currentTab === 'menu'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[#a79bbd] hover:text-[#fdf8f4]'
            }`}
          >
            MENU
          </button>
          <button
            id="nav-tab-card"
            onClick={() => onSelectTab('card')}
            className={`px-4 py-1.5 text-xs font-sans font-semibold tracking-wide uppercase rounded-md transition-all cursor-pointer ${
              currentTab === 'card'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[#a79bbd] hover:text-[#fdf8f4]'
            }`}
          >
            INFO
          </button>
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Share */}
          <button
            id="nav-share-btn"
            onClick={onShare}
            className="p-2 text-[#bfa9d6] hover:text-white hover:bg-[#1f0e34] rounded-lg border border-purple-900/40 transition-colors cursor-pointer"
            title="Share Menu"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* QR Modal */}
          <button
            id="nav-qr-btn"
            onClick={onOpenQr}
            className="p-2 text-[#bfa9d6] hover:text-white hover:bg-[#1f0e34] rounded-lg border border-purple-900/40 transition-colors cursor-pointer"
            title="Scan Menu QR"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

