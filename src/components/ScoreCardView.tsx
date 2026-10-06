import React from 'react';
import { Boss, Language } from '../types';
import { getSpawnRateColorClass } from '../services/sheetService';
import { formatTime24h } from '../utils/timeFormat';
import { Clock, Timer, Crown, Zap } from 'lucide-react';

interface ScoreCardViewProps {
  bosses: Boss[];
  language: Language;
  currentTime?: number;
  onSelectBoss?: (boss: Boss) => void;
}

export const ScoreCardView: React.FC<ScoreCardViewProps> = ({
  bosses,
  language,
  currentTime,
  onSelectBoss,
}) => {
  if (bosses.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-700/80 my-3">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
          {language === 'vi' ? 'Không tìm thấy Boss phù hợp.' : 'No bosses match your search.'}
        </p>
      </div>
    );
  }

  const now = currentTime || Date.now();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 my-3">
      {bosses.map((boss) => {
        const displayName = language === 'en' && boss.nameEn ? boss.nameEn : boss.name;

        // Countdown calculation
        const spawnMs = boss.nextSpawnAt ? new Date(boss.nextSpawnAt).getTime() : 0;
        const diffSec = spawnMs > 0 ? Math.floor((spawnMs - now) / 1000) : 0;
        const isJustSpawned = spawnMs > 0 && diffSec <= 0 && Math.abs(diffSec) < 60;

        let countdownText = '--:--:--';
        let countdownBadgeStyle = 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

        if (spawnMs > 0) {
          if (diffSec <= 0) {
            const elapsedSec = Math.abs(diffSec);
            if (elapsedSec < 60) {
              countdownText = language === 'vi' ? 'XUẤT HIỆN' : 'SPAWN';
              countdownBadgeStyle = 'text-white bg-emerald-600 border border-emerald-500 font-bold shadow-xs animate-pulse';
            } else {
              const elapsedMins = Math.floor(elapsedSec / 60);
              countdownText = elapsedMins > 0 
                ? (language === 'vi' ? `ĐÃ RA (${elapsedMins}p)` : `ALIVE (${elapsedMins}m)`)
                : (language === 'vi' ? 'ĐÃ RA' : 'ALIVE');
              countdownBadgeStyle = 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30 font-black';
            }
          } else {
            const hrs = Math.floor(diffSec / 3600);
            const mins = Math.floor((diffSec % 3600) / 60);
            const secs = diffSec % 60;
            const pad = (n: number) => String(n).padStart(2, '0');
            countdownText = hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;

            if (diffSec <= 300) {
              countdownBadgeStyle = 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30 animate-pulse font-black';
            } else if (diffSec <= 1800) {
              countdownBadgeStyle = 'text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/30 font-black';
            } else {
              countdownBadgeStyle = 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-black';
            }
          }
        }

        const spawnTimeFormatted = boss.nextSpawnAt ? formatTime24h(boss.nextSpawnAt) : '--:--:--';

        return (
          <div
            key={boss.id}
            className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 ${
              isJustSpawned 
                ? 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20' 
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Top row: Big Boss Name + Spawn Rate Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                {boss.image && (
                  <img
                    src={boss.image}
                    alt={displayName}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors leading-snug">
                      {displayName}
                    </h3>
                    {boss.isBigBoss && (
                      <span title="Big Boss" className="inline-flex items-center justify-center p-1 rounded-md text-amber-500 bg-amber-500/15 border border-amber-500/30 shadow-xs shrink-0">
                        <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      </span>
                    )}
                    {boss.category === 'invasion' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 uppercase tracking-wider shrink-0">
                        <Zap className="w-2.5 h-2.5 fill-purple-500/40 text-purple-500" />
                        <span>Invasion</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tỉ lệ ra */}
              <span className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono border shrink-0 ${getSpawnRateColorClass(boss.spawnRate).badge}`}>
                {boss.spawnRate || '100%'}
              </span>
            </div>

            {/* Central HERO block: THỜI GIAN RA (24H) - Luminous, Prominent & Eye-Catching */}
            <div className="py-3.5 px-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/15 to-amber-600/10 dark:from-amber-400/10 dark:via-amber-400/20 dark:to-amber-500/10 border-2 border-amber-500/50 dark:border-amber-400/60 text-center shadow-xs group-hover:border-amber-500 dark:group-hover:border-amber-400 transition-all">
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5 mb-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'vi' ? 'THỜI GIAN RA' : 'SPAWN TIME (24H)'}</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white drop-shadow-xs">
                {spawnTimeFormatted}
              </div>
            </div>

            {/* Bottom Supporting Element: Countdown Timer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{language === 'vi' ? 'Đếm ngược:' : 'Countdown:'}</span>
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-mono text-xs sm:text-sm font-black tracking-wide border shadow-2xs whitespace-nowrap ${countdownBadgeStyle}`}>
                {countdownText}
              </span>
            </div>

          </div>
        );
      })}
    </div>
  );
};
