import React from 'react';
import { Language, BossCategory } from '../types';
import { Swords, Zap } from 'lucide-react';

interface BossCategoryTabsProps {
  activeCategory: BossCategory;
  onChangeCategory: (cat: BossCategory) => void;
  localCount: number;
  invasionCount: number;
  language: Language;
}

export const BossCategoryTabs: React.FC<BossCategoryTabsProps> = ({
  activeCategory,
  onChangeCategory,
  localCount,
  invasionCount,
  language,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900/90 p-1.5 sm:p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
      {/* 1. Local Boss (Default) */}
      <button
        type="button"
        onClick={() => onChangeCategory('local')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
          activeCategory === 'local'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/40'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
        }`}
      >
        <Swords className={`w-4 h-4 shrink-0 ${activeCategory === 'local' ? 'text-white' : 'text-indigo-500'}`} />
        <span className="tracking-wide uppercase font-bold">
          {language === 'vi' ? 'Local Boss' : 'Local Boss'}
        </span>
        <span
          className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
            activeCategory === 'local'
              ? 'bg-white/20 text-white'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          {localCount}
        </span>
      </button>

      {/* 2. Invasion */}
      <button
        type="button"
        onClick={() => onChangeCategory('invasion')}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
          activeCategory === 'invasion'
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-300/40 font-black'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
        }`}
      >
        <Zap className={`w-4 h-4 shrink-0 ${activeCategory === 'invasion' ? 'text-slate-950 fill-slate-950' : 'text-amber-500 fill-amber-500'}`} />
        <span className="tracking-wide uppercase font-bold">
          Invasion
        </span>
        <span
          className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
            activeCategory === 'invasion'
              ? 'bg-slate-950/20 text-slate-950'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          {invasionCount}
        </span>
      </button>
    </div>
  );
};
