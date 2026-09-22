import React from 'react';
import { BRAND_INFO } from '../data/brandData';
import { ArrowUp } from 'lucide-react';
import { MainTab } from '../types';

interface FooterProps {
  onSelectTab: (tab: MainTab) => void;
  onOpenManager?: () => void;
}

export const Footer: React.FC<FooterProps> = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#080510] border-t border-purple-900/30 text-[#a79bbd] py-10 font-sans pb-28 lg:pb-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Brand info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-purple-900/30">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl text-[#fdf8f4] font-semibold uppercase">
                {BRAND_INFO.name}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>

            <p className="text-sm text-purple-200 font-sans leading-relaxed max-w-md">
              Tumchi aplyach bhasha ani aplya gavachi chav! Freshly fizzy sodas, chilled classic cold coffee & delicious softy swirls.
            </p>

            <div className="pt-0.5 text-xs font-sans text-amber-300 font-medium">
              Soda • Cold Coffee • Softy
            </div>
          </div>

          <button
            onClick={scrollToTop}
            className="self-start sm:self-center flex items-center gap-1.5 text-xs font-mono text-[#d8b4fe] hover:text-white transition-colors cursor-pointer font-medium bg-[#160c26] border border-purple-900/40 px-3.5 py-2 rounded-xs"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom bar */}
        <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
          <div className="space-y-1">
            <div className="text-xs text-purple-300 font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>Developed By: <strong className="text-[#faf7fd] font-medium">Prinkesh Devi</strong></span>
              <span className="text-[#6d5c85]">•</span>
              <span>Mob: <a href="tel:7385010471" className="text-amber-300 hover:text-amber-200 transition-colors font-mono font-medium">7385010471</a></span>
            </div>
            <p className="text-[#8c7a9e] text-[11px] sm:text-xs">
              © {new Date().getFullYear()} {BRAND_INFO.name}. Banavle premene tumchya sathi.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};
