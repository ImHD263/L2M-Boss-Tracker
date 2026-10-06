import React, { useMemo, useState, useEffect } from 'react';
import { Boss, KPIStatsData, Language, FilterState, BossTimeReport, UserRole } from '../types';
import { getTranslation } from '../i18n/translations';
import { 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  MapPin, 
  Radio, 
  Timer, 
  Target, 
  Table, 
  LayoutGrid, 
  CheckCircle2, 
  RotateCcw,
  AlertTriangle,
  Info,
  Swords
} from 'lucide-react';
import { formatRemainingTime, getSpawnRateColorClass } from '../services/sheetService';
import { formatTime24h } from '../utils/timeFormat';

interface KPIStatsProps {
  stats?: KPIStatsData;
  bosses?: Boss[];
  language: Language;
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  onFilterStatus?: (status: 'all' | 'alive' | 'soon' | 'cooldown') => void;
  activeStatusFilter?: string;
  onSelectBoss?: (boss: Boss) => void;
  onMarkKilled?: (boss: Boss) => void;
  onReportWrongTime?: (boss: Boss) => void;
  reports?: BossTimeReport[];
  userRole?: UserRole;
}

export const KPIStats: React.FC<KPIStatsProps> = ({
  bosses = [],
  language,
  filter,
  setFilter,
  onSelectBoss,
  onMarkKilled,
  onReportWrongTime,
  reports = [],
  userRole = 'member',
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  // Live 1-second ticker for real-time countdown
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // View mode specifically for the 30-min section: Table view by default
  const [detailViewMode, setDetailViewMode] = useState<'table' | 'cards'>('table');

  // Time window range for upcoming bosses table: '30m' (default), '60m', or 'all'
  const [upcomingRange, setUpcomingRange] = useState<'30m' | '60m' | 'all'>('30m');

  // Find the single next boss that will spawn earliest in the future
  const nextUpcomingBoss = useMemo(() => {
    if (!bosses || bosses.length === 0) return null;
    const now = currentTime;
    
    const futureBosses = bosses
      .filter(b => b.nextSpawnAt && new Date(b.nextSpawnAt).getTime() > now)
      .sort((a, b) => new Date(a.nextSpawnAt!).getTime() - new Date(b.nextSpawnAt!).getTime());

    return futureBosses.length > 0 ? futureBosses[0] : null;
  }, [bosses, currentTime]);

  // ALL bosses in the selected window (strictly upcoming in the future, diffMs > 0)
  const allBossesInWindow = useMemo(() => {
    if (!bosses || bosses.length === 0) return [];
    const now = currentTime;

    return bosses
      .filter(b => {
        if (!b.nextSpawnAt) return false;
        const spawnTime = new Date(b.nextSpawnAt).getTime();
        if (isNaN(spawnTime)) return false;
        const diffMs = spawnTime - now;
        
        // CRITICAL FIX: Bosses MUST be in the FUTURE (diffMs > 0)!
        // Do NOT include bosses that spawned in the past (diffMs <= 0)
        if (diffMs <= 0) return false;

        if (upcomingRange === '30m') {
          return diffMs <= 30 * 60 * 1000;
        } else if (upcomingRange === '60m') {
          return diffMs <= 60 * 60 * 1000;
        }
        return true; // 'all' upcoming
      })
      .sort((a, b) => {
        const timeA = a.nextSpawnAt ? new Date(a.nextSpawnAt).getTime() : 0;
        const timeB = b.nextSpawnAt ? new Date(b.nextSpawnAt).getTime() : 0;
        return timeA - timeB; // Strictly chronological order (earliest future first)
      });
  }, [bosses, upcomingRange, currentTime]);

  // FILTERED bosses in the upcoming window (affected by Search, Map, Channel, Status & Sort)
  const filteredBossesIn30Mins = useMemo(() => {
    return allBossesInWindow
      .filter(boss => {
        const displayName = (language === 'en' && boss.nameEn ? boss.nameEn : boss.name).toLowerCase();
        const displayMap = (language === 'en' && boss.mapEn ? boss.mapEn : boss.map).toLowerCase();
        const query = filter.searchQuery.toLowerCase().trim();

        // Search Filter
        if (query) {
          const matchName = displayName.includes(query) || boss.name.toLowerCase().includes(query);
          const matchMap = displayMap.includes(query);
          const matchChannel = boss.channel.toLowerCase().includes(query);
          const matchDrops = boss.drops.some(d => d.toLowerCase().includes(query));
          if (!matchName && !matchMap && !matchChannel && !matchDrops) return false;
        }

        // Status Filter
        if (filter.status !== 'all' && boss.status !== filter.status) {
          return false;
        }

        // Map Filter
        if (filter.map !== 'all') {
          const currentDisplayMap = language === 'en' && boss.mapEn ? boss.mapEn : boss.map;
          if (currentDisplayMap !== filter.map && boss.map !== filter.map) return false;
        }

        // Channel Filter
        if (filter.channel !== 'all' && boss.channel !== filter.channel) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filter.sortBy === 'level') {
          return b.level - a.level;
        } else if (filter.sortBy === 'cooldown') {
          return a.respawnMinutes - b.respawnMinutes;
        } else if (filter.sortBy === 'name') {
          const nameA = language === 'en' && a.nameEn ? a.nameEn : a.name;
          const nameB = language === 'en' && b.nameEn ? b.nameEn : b.name;
          return nameA.localeCompare(nameB);
        } else {
          // 'nextSpawn' - strictly chronological by upcoming spawn time
          const timeA = a.nextSpawnAt ? new Date(a.nextSpawnAt).getTime() : 0;
          const timeB = b.nextSpawnAt ? new Date(b.nextSpawnAt).getTime() : 0;
          return timeA - timeB;
        }
      });
  }, [allBossesInWindow, filter, language]);

  const bossName = nextUpcomingBoss
    ? (language === 'en' && nextUpcomingBoss.nameEn ? nextUpcomingBoss.nameEn : nextUpcomingBoss.name)
    : null;

  const bossMap = nextUpcomingBoss
    ? (language === 'en' && nextUpcomingBoss.mapEn ? nextUpcomingBoss.mapEn : nextUpcomingBoss.map)
    : null;

  const spawnTimeFormatted = nextUpcomingBoss?.nextSpawnAt
    ? formatTime24h(nextUpcomingBoss.nextSpawnAt)
    : null;

  // Real-time countdown calculation from current moment (currentTime) to nextSpawnAt
  const countdown = useMemo(() => {
    if (!nextUpcomingBoss || !nextUpcomingBoss.nextSpawnAt) return null;
    const targetMs = new Date(nextUpcomingBoss.nextSpawnAt).getTime();
    if (isNaN(targetMs)) return null;

    const diffMs = targetMs - currentTime;

    if (diffMs <= 0) {
      return {
        isExpired: true,
        diffMs: 0,
        hours: '00',
        minutes: '00',
        seconds: '00',
        totalSeconds: 0,
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      isExpired: false,
      diffMs,
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      totalSeconds,
    };
  }, [nextUpcomingBoss, currentTime]);

  const hasFilterActive = 
    filter.searchQuery.trim() !== '' || 
    filter.status !== 'all' || 
    filter.map !== 'all' || 
    filter.channel !== 'all' || 
    Boolean(filter.in30MinsOnly);

  const resetAllFilters = () => {
    setFilter({
      searchQuery: '',
      status: 'all',
      channel: 'all',
      map: 'all',
      sortBy: 'nextSpawn',
      sortOrder: 'desc',
      in30MinsOnly: false,
    });
  };

  return (
    <div className="my-4 space-y-4">
      
      {/* HERO SCORECARD: BOSS SẮP RA KẾ TIẾP */}
      <div className="w-full">
        <div
          onClick={() => {
            if (nextUpcomingBoss && onSelectBoss) {
              onSelectBoss(nextUpcomingBoss);
            }
          }}
          className="w-full p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white border border-indigo-500/40 hover:border-indigo-400 shadow-lg relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl group-hover:bg-indigo-500/25 transition-all pointer-events-none" />
          
          {/* Header Badge & Tỷ lệ ra */}
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              {language === 'vi' ? 'BOSS SẮP RA KẾ TIẾP' : 'NEXT UPCOMING BOSS'}
            </span>

            <div className="flex items-center gap-2">
              {nextUpcomingBoss && (() => {
                const rateColors = getSpawnRateColorClass(nextUpcomingBoss.spawnRate);
                return (
                  <span className={`px-2.5 py-0.5 rounded-md ${rateColors.darkBadge} text-[11px] font-black border flex items-center gap-1`}>
                    <Target className="w-3.5 h-3.5" />
                    {language === 'vi' ? 'Tỷ lệ ra:' : 'Rate:'} {nextUpcomingBoss.spawnRate || '100%'}
                  </span>
                );
              })()}

              {nextUpcomingBoss?.channel && (
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30">
                  {language === 'vi' ? `Kênh ${nextUpcomingBoss.channel}` : `Ch.${nextUpcomingBoss.channel}`}
                </span>
              )}
            </div>
          </div>

          {nextUpcomingBoss ? (
            <div className="mt-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Left Column: Boss Info */}
              <div className="md:col-span-5 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 text-xs font-black border border-slate-700 shadow-xs">
                    Lv.{nextUpcomingBoss.level || '?'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-amber-300 transition-colors truncate">
                    {bossName}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-indigo-500/30 shadow-xs">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-bold text-slate-100">{bossMap}</span>
                  </span>
                  {nextUpcomingBoss.respawnMinutes && (
                    <span className="text-xs text-slate-400 font-medium bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      {language === 'vi' ? `Thời gian hồi: ${nextUpcomingBoss.respawnMinutes} phút` : `Respawn: ${nextUpcomingBoss.respawnMinutes}m`}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-indigo-300/80 flex items-center gap-1.5 pt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                  <span>{language === 'vi' ? 'Bấm vào thẻ này để chuyển ngay tới vị trí Boss trên bảng' : 'Click to jump to boss location in table'}</span>
                </p>
              </div>

              {/* Right Column: Real-time Countdown Timer */}
              <div className="md:col-span-7">
                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-950/90 border border-indigo-500/30 shadow-inner space-y-2.5">
                  {/* Header bar: Giờ ra dự kiến + Live indicator */}
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400">
                      <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span className="text-[11px] sm:text-xs uppercase tracking-wide">
                        {language === 'vi' ? 'ĐẾM NGƯỢC THỜI GIAN THỰC' : 'REAL-TIME COUNTDOWN'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-slate-400">{language === 'vi' ? 'Giờ ra:' : 'Spawn:'}</span>
                      <span className="font-mono font-black text-amber-400 text-sm">{spawnTimeFormatted || '--:--'}</span>
                    </div>
                  </div>

                  {countdown?.isExpired ? (
                    <div className="py-3 px-2 text-center bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 font-black animate-pulse flex items-center justify-center gap-2 text-xs sm:text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span>{language === 'vi' ? 'BOSS ĐÃ ĐẾN GIỜ XUẤT HIỆN! (VÀO VỊ TRÍ)' : 'BOSS HAS SPAWNED! (GO NOW)'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 sm:gap-4 py-1">
                      {/* HOURS */}
                      <div className="flex flex-col items-center">
                        <div className="w-14 sm:w-18 h-12 sm:h-13 rounded-xl bg-slate-900/95 border border-indigo-500/40 flex items-center justify-center shadow-lg">
                          <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-wider">
                            {countdown?.hours || '00'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          {language === 'vi' ? 'Giờ' : 'Hours'}
                        </span>
                      </div>

                      <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400/80 pb-3 animate-pulse">:</span>

                      {/* MINUTES */}
                      <div className="flex flex-col items-center">
                        <div className="w-14 sm:w-18 h-12 sm:h-13 rounded-xl bg-slate-900/95 border border-indigo-500/40 flex items-center justify-center shadow-lg">
                          <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-wider">
                            {countdown?.minutes || '00'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          {language === 'vi' ? 'Phút' : 'Mins'}
                        </span>
                      </div>

                      <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400/80 pb-3 animate-pulse">:</span>

                      {/* SECONDS */}
                      <div className="flex flex-col items-center">
                        <div className="w-14 sm:w-18 h-12 sm:h-13 rounded-xl bg-slate-900/95 border border-emerald-500/50 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                          <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 tracking-wider">
                            {countdown?.seconds || '00'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          {language === 'vi' ? 'Giây' : 'Secs'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status indicator footer note */}
                  <div className="pt-2 border-t border-indigo-500/15 flex items-center justify-between text-[10px] sm:text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      <span className="text-emerald-300 font-semibold">
                        {countdown?.totalSeconds && countdown.totalSeconds <= 300
                          ? (language === 'vi' ? '⚠️ SẮP RA (DƯỚI 5 PHÚT) - CHUẨN BỊ!' : '⚠️ SPAWNING SOON (< 5 MINS)!')
                          : countdown?.totalSeconds && countdown.totalSeconds <= 1800
                          ? (language === 'vi' ? '⚡ Chuẩn bị tập hợp đánh Boss' : '⚡ Get ready to rally')
                          : (language === 'vi' ? 'Đang đếm lùi thời gian thực' : 'Real-time countdown active')}
                      </span>
                    </span>
                    <span className="text-indigo-300/80 hidden sm:inline">
                      {language === 'vi' ? 'Đồng bộ Google Sheet' : 'Synced with Sheet'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="mt-4 py-4 text-xs font-medium text-slate-400 flex items-center justify-center gap-2 bg-slate-900/50 rounded-xl border border-slate-800">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>
                {language === 'vi' ? 'Tất cả Boss đã xuất hiện hoặc chưa có lịch!' : 'All bosses are currently alive or no schedule set!'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CHI TIẾT BOSS RA TRONG 30 PHÚT TỚI (AFFECTED BY FILTER BAR & SCORECARD) */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors space-y-3">
        
        {/* Table/Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  {upcomingRange === '30m'
                    ? (language === 'vi' ? 'Chi Tiết Boss Ra Trong 30 Phút Tới' : 'Detailed Bosses Spawning in 30 Mins')
                    : upcomingRange === '60m'
                    ? (language === 'vi' ? 'Chi Tiết Boss Ra Trong 60 Phút Tới' : 'Detailed Bosses Spawning in 60 Mins')
                    : (language === 'vi' ? 'Danh Sách Toàn Bộ Boss Sắp Ra Tiếp Theo' : 'All Next Upcoming Bosses')}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-xs">
                  {filteredBossesIn30Mins.length} {language === 'vi' ? 'Boss' : 'Bosses'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hasFilterActive 
                  ? (language === 'vi' ? `Đang áp dụng bộ lọc từ bảng / scorecard (${filteredBossesIn30Mins.length}/${allBossesInWindow.length} Boss)` : `Filtered by table/scorecard (${filteredBossesIn30Mins.length}/${allBossesInWindow.length} bosses)`)
                  : (language === 'vi' ? 'Tự động đếm ngược thời gian thực theo lịch Google Sheet (chỉ Boss sắp ra, không tính Boss đã qua giờ)' : 'Auto realtime countdown for upcoming bosses only')}
              </p>
            </div>
          </div>

          {/* Controls: Range Selector + View Mode Toggle & Reset */}
          <div className="flex items-center flex-wrap gap-2 self-start md:self-auto">
            
            {/* Range Toggle: 30m | 60m | All Upcoming */}
            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex items-center border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setUpcomingRange('30m')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  upcomingRange === '30m'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={language === 'vi' ? 'Xem các Boss sắp ra trong 30 phút' : 'View bosses in 30 mins'}
              >
                30 {language === 'vi' ? 'phút' : 'mins'}
              </button>
              <button
                onClick={() => setUpcomingRange('60m')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  upcomingRange === '60m'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={language === 'vi' ? 'Xem các Boss sắp ra trong 60 phút' : 'View bosses in 60 mins'}
              >
                60 {language === 'vi' ? 'phút' : 'mins'}
              </button>
              <button
                onClick={() => setUpcomingRange('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  upcomingRange === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={language === 'vi' ? 'Xem toàn bộ danh sách sắp ra theo thứ tự thời gian' : 'View all upcoming bosses in order'}
              >
                {language === 'vi' ? 'Tất cả sắp ra' : 'All Upcoming'}
              </button>
            </div>

            {hasFilterActive && (
              <button
                onClick={resetAllFilters}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 rounded-xl transition-all flex items-center gap-1"
                title="Xóa bộ lọc"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'vi' ? 'Xóa Lọc' : 'Clear Filter'}</span>
              </button>
            )}

            <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setDetailViewMode('table')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  detailViewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Dạng Bảng"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'vi' ? 'Bảng' : 'Table'}</span>
              </button>

              <button
                onClick={() => setDetailViewMode('cards')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  detailViewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Dạng Thẻ"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'vi' ? 'Thẻ' : 'Cards'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Content Area: Empty States or Results */}
        {filteredBossesIn30Mins.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium space-y-2">
            <Info className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600" />
            <p>
              {allBossesInWindow.length > 0 
                ? (language === 'vi'
                    ? `Có ${allBossesInWindow.length} Boss sắp ra trong khung giờ này, nhưng không khớp với bộ lọc bạn đã chọn.`
                    : `${allBossesInWindow.length} bosses spawning in this window, but none match your active filter.`)
                : (language === 'vi'
                    ? 'Hiện không có Boss nào dự kiến xuất hiện trong khung thời gian này.'
                    : 'No bosses scheduled to spawn in this time window.')}
            </p>
            {hasFilterActive && (
              <button
                onClick={resetAllFilters}
                className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Xóa Bộ Lọc Để Xem Tất Cả' : 'Reset Filters To View All'}</span>
              </button>
            )}
          </div>
        ) : detailViewMode === 'table' ? (
          
          /* VIEW 1: HORIZONTAL RESPONSIVE TABLE */
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/90">{t('thBoss')}</th>
                  <th className="py-2.5 px-3">{t('thMap')}</th>
                  <th className="py-2.5 px-3">{language === 'vi' ? 'Kênh' : 'Channel'}</th>
                  <th className="py-2.5 px-3">{language === 'vi' ? 'Tỷ Lệ' : 'Rate'}</th>
                  <th className="py-2.5 px-3">{language === 'vi' ? 'Giờ Ra' : 'Spawn Time'}</th>
                  <th className="py-2.5 px-3 text-right">{language === 'vi' ? 'Đếm Ngược Còn Lại' : 'Remaining'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredBossesIn30Mins.map((boss) => {
                  const displayName = language === 'en' && boss.nameEn ? boss.nameEn : boss.name;
                  const displayMap = language === 'en' && boss.mapEn ? boss.mapEn : boss.map;
                  const timerInfo = formatRemainingTime(boss.nextSpawnAt, language);
                  const spawnTimeFormatted = formatTime24h(boss.nextSpawnAt);
                  const rateColors = getSpawnRateColorClass(boss.spawnRate);

                  return (
                    <tr 
                      key={boss.id}
                      onClick={() => onSelectBoss && onSelectBoss(boss)}
                      className="hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-colors group cursor-pointer"
                      title={language === 'vi' ? 'Bấm để xem vị trí Boss' : 'Click to view boss'}
                    >
                      {/* Boss Info */}
                      <td className="py-2.5 px-3 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-amber-50/50 dark:group-hover:bg-slate-900 shadow-xs">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center font-black text-xs text-amber-500">
                            {boss.image ? (
                              <img src={boss.image} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{displayName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors truncate max-w-[150px]">
                              {displayName}
                            </div>
                            {language === 'vi' && boss.nameEn && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                {boss.nameEn}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Map */}
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-1 truncate max-w-[140px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{displayMap}</span>
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] border border-slate-200 dark:border-slate-700">
                          {boss.channel ? `Kênh ${boss.channel}` : 'Ch.1'}
                        </span>
                      </td>

                      {/* Spawn Rate */}
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-md ${rateColors.badge} text-[10px] font-black border`}>
                          {boss.spawnRate || '100%'}
                        </span>
                      </td>

                      {/* Spawn Time */}
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {spawnTimeFormatted}
                      </td>

                      {/* Countdown */}
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 animate-pulse" />
                          <span>{timerInfo.text}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        ) : (
          
          /* VIEW 2: CARDS GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredBossesIn30Mins.map((boss) => {
              const displayName = language === 'en' && boss.nameEn ? boss.nameEn : boss.name;
              const displayMap = language === 'en' && boss.mapEn ? boss.mapEn : boss.map;
              const timerInfo = formatRemainingTime(boss.nextSpawnAt, language);
              const spawnTimeFormatted = formatTime24h(boss.nextSpawnAt);
              const rateColors = getSpawnRateColorClass(boss.spawnRate);

              return (
                <div
                  key={boss.id}
                  onClick={() => onSelectBoss && onSelectBoss(boss)}
                  className="flex flex-col justify-between p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500/10 dark:hover:bg-amber-500/15 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/50 transition-all group shadow-xs cursor-pointer"
                  title={language === 'vi' ? 'Bấm để xem vị trí Boss' : 'Click to view boss'}
                >
                  <div className="flex items-start justify-between space-x-2.5">
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 shrink-0 flex items-center justify-center font-black text-xs text-amber-500 border border-slate-300 dark:border-slate-700">
                        {boss.image ? (
                          <img src={boss.image} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{displayName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors text-xs truncate">
                            {displayName}
                          </h4>
                          <span className={`px-1.5 py-0.2 rounded ${rateColors.badge} text-[9px] font-black shrink-0 border`}>
                            {boss.spawnRate || '100%'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span className="truncate">{displayMap}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-1">
                        <Clock className="w-2.5 h-2.5 text-indigo-500" />
                        <span>{spawnTimeFormatted}</span>
                      </div>
                      <div className="text-[10px] font-mono font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                        {timerInfo.text}
                      </div>
                    </div>
                  </div>

                  {/* Channel & Jump hint footer */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                      {boss.channel ? `Kênh ${boss.channel}` : 'Ch.1'}
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-amber-500 transition-colors">
                      {language === 'vi' ? 'Bấm để xem vị trí →' : 'Click to view →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        )}

      </div>

    </div>
  );
};
