import React from 'react';
import { BRAND_INFO } from '../data/brandData';
import {
  Share2,
  Navigation,
  Utensils,
} from 'lucide-react';

interface DigitalCardSectionProps {
  onExploreMenu: () => void;
  onShare: () => void;
}

export const DigitalCardSection: React.FC<DigitalCardSectionProps> = ({
  onExploreMenu,
  onShare,
}) => {
  return (
    <section id="card" className="relative py-14 sm:py-20 px-4 sm:px-6 bg-[#07050d] border-b border-purple-950/40">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md mx-auto relative z-10">
        
        {/* Section Header Tag */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-mono tracking-[0.3em] text-[#d8b4fe] uppercase block mb-1">
            03 / IDENTITY
          </span>
          <h2 className="font-serif text-3xl text-[#faf7fd] tracking-[0.08em] font-normal uppercase">
            DIGITAL CARD
          </h2>
          <div className="w-10 h-[1px] bg-purple-500/50 mx-auto mt-2" />
        </div>

        {/* Premium Digital Visiting Card */}
        <div className="relative rounded-lg overflow-hidden bg-[#0c0717] border border-purple-500/40 p-6 sm:p-7 shadow-[0_0_40px_rgba(147,51,234,0.2)]">
          
          {/* Top Neon Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

          {/* Shop Logo & Name */}
          <div className="text-center space-y-2 pb-6 border-b border-purple-900/40">
            <div className="w-16 h-16 mx-auto rounded-xl bg-[#190b2b] border border-purple-500/60 flex items-center justify-center text-amber-300 font-serif font-bold text-3xl tracking-wider shadow-md">
              N
            </div>

            <div>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#fdf8f4] font-semibold uppercase">
                {BRAND_INFO.name}
              </h3>
              <p className="text-xs font-sans text-amber-300 font-medium pt-0.5">
                "Ek baar piyo, baar baar aao!"
              </p>
              <p className="text-xs font-sans text-purple-200 pt-0.5">
                Soda • Cold Coffee • Softy
              </p>
            </div>
          </div>

          {/* Clean Navigation Links */}
          <div className="py-5 space-y-2.5">
            
            {/* Directions */}
            <div className="flex items-center justify-between p-3 bg-[#110820] border border-purple-900/40 rounded-xs">
              <div className="flex items-center gap-2.5">
                <Navigation className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="text-[10px] font-mono text-[#8a7a9f] uppercase tracking-wider">
                    DIRECTIONS
                  </div>
                  <div className="text-xs text-[#faf7fd]">Open in Google Maps</div>
                </div>
              </div>
              <a
                href={BRAND_INFO.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-purple-950/80 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-700/50 rounded-xs text-[10px] font-mono tracking-wider uppercase transition-colors"
              >
                Maps
              </a>
            </div>

          </div>

          {/* Action Buttons: VIEW MENU, SHARE CARD */}
          <div className="pt-2 space-y-2">
            <button
              id="card-view-menu-btn"
              onClick={onExploreMenu}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-mono font-semibold text-xs tracking-[0.2em] uppercase rounded-xs transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>VIEW MENU</span>
            </button>

            <button
              id="card-share-card-btn"
              onClick={onShare}
              className="w-full py-2.5 px-3 bg-[#160c28] hover:bg-[#20113b] text-[#e9d5ff] border border-purple-800/50 hover:border-purple-600/70 rounded-xs text-[11px] font-mono tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              <span>SHARE CARD</span>
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
