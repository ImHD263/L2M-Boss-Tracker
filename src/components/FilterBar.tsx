import React from 'react';
import { RotateCcw, Zap, Crown, Swords } from 'lucide-react';
import { FilterState, Language } from '../types';

interface FilterBarProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  language: Language;
  countAll?: number;
  countBigBoss?: number;
  countInvasion?: number;
  countLocal?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  setFilter,
  language,
  countAll = 0,
  countBigBoss = 0,
  countInvasion = 0,
  countLocal = 0,
}) => {
  const isBigBossActive = Boolean(filter.bigBossOnly);
  const isAllActive = !isBigBossActive && (!filter.category || filter.category === 'all');
  const isInvasionActive = filter.category === 'invasion';
  const isLocalActive = filter.category === 'local';

  const hasActiveFilters = 
    filter.searchQuery.trim() !== '' || 
    isBigBossActive ||
    (filter.category && filter.category !== 'all') ||
    filter.status !== 'all';

  const handleResetFilters = () => {
    setFilter(prev => ({
      ...prev,
      searchQuery: '',
      status: 'all',
      upcomingWindow: 'all',
      in30MinsOnly: false,
      bigBossOnly: false,
      category: 'all',
      sortBy: 'nextSpawn',
      sortOrder: 'asc',
    }));
  };

  const handleSelectAll = () => {
    setFilter(prev => ({
      ...prev,
      status: 'all',
      bigBossOnly: false,
      category: 'all',
    }));
  };

  const handleToggleBigBoss = () => {
    setFilter(prev => ({
      ...prev,
      bigBossOnly: !prev.bigBossOnly,
    }));
  };

  const handleToggleInvasion = () => {
    setFilter(prev => ({
      ...prev,
      category: prev.category === 'invasion' ? 'all' : 'invasion',
    }));
  };

  const handleToggleLocal = () => {
    setFilter(prev => ({
      ...prev,
      category: prev.category === 'local' ? 'all' : 'local',
    }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-3 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors flex flex-wrap items-center justify-between gap-3">
      {/* Quick Filters: Tất Cả (Mặc định cả 2), Big Boss, Invasion, Local Boss & Sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter Tabs: Tất Cả | 👑 Big Boss | ⚡ Invasion | ⚔️ Local Boss */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-wrap gap-1">
          {/* Tất Cả (Mặc định hiện cả Local & Invasion) */}
          <button
            onClick={handleSelectAll}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isAllActive
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={language === 'vi' ? 'Hiển thị tất cả Boss (Cả Local Boss & Invasion)' : 'Show all bosses (Both Local & Invasion)'}
          >
            <span>{language === 'vi' ? 'Tất Cả' : 'All'}</span>
            {countAll > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isAllActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {countAll}
              </span>
            )}
          </button>

          {/* Big Boss Filter - Keeps crown AND text Big Boss */}
          <button
            onClick={handleToggleBigBoss}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isBigBossActive
                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white shadow-xs font-black ring-1 ring-amber-300'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
            title={language === 'vi' ? 'Lọc chỉ các Boss Lớn (Big Boss)' : 'Show Big Bosses only'}
          >
            <Crown className={`w-3.5 h-3.5 ${isBigBossActive ? 'text-amber-200 fill-amber-200' : 'text-amber-500 fill-amber-500'}`} />
            <span>Big Boss</span>
            {countBigBoss > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                isBigBossActive ? 'bg-white text-rose-600' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}>
                {countBigBoss}
              </span>
            )}
          </button>

          {/* Invasion Filter */}
          <button
            onClick={handleToggleInvasion}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isInvasionActive
                ? 'bg-purple-600 text-white shadow-xs font-black ring-1 ring-purple-300'
                : 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
            }`}
            title={language === 'vi' ? 'Lọc chỉ Boss Xâm Lược (Invasion)' : 'Show Invasion Bosses only'}
          >
            <Zap className={`w-3.5 h-3.5 ${isInvasionActive ? 'text-white fill-white' : 'text-purple-500 fill-purple-500/30'}`} />
            <span>Invasion</span>
            {countInvasion > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                isInvasionActive ? 'bg-white text-purple-700' : 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
              }`}>
                {countInvasion}
              </span>
            )}
          </button>

          {/* Local Boss Filter */}
          <button
            onClick={handleToggleLocal}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isLocalActive
                ? 'bg-indigo-600 text-white shadow-xs font-black ring-1 ring-indigo-300'
                : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10'
            }`}
            title={language === 'vi' ? 'Lọc chỉ Boss Địa Phương (Local Boss)' : 'Show Local Bosses only'}
          >
            <Swords className={`w-3.5 h-3.5 ${isLocalActive ? 'text-white' : 'text-indigo-500'}`} />
            <span>Local Boss</span>
            {countLocal > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                isLocalActive ? 'bg-white text-indigo-700' : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
              }`}>
                {countLocal}
              </span>
            )}
          </button>
        </div>

        {/* Reset button if active filter */}
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-xl transition-colors cursor-pointer"
            title={language === 'vi' ? 'Xóa lọc' : 'Reset'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

      </div>

    </div>
  );
};
