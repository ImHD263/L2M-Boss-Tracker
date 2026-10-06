import React from 'react';
import { Boss, Language, FilterState } from '../types';
import { getTranslation } from '../i18n/translations';
import { Clock, Timer, Crown, Zap } from 'lucide-react';
import { getSpawnRateColorClass } from '../services/sheetService';
import { formatTime24h } from '../utils/timeFormat';

interface HorizontalTableViewProps {
  bosses: Boss[];
  language: Language;
  currentTime?: number;
  filter?: FilterState;
  setFilter?: React.Dispatch<React.SetStateAction<FilterState>>;
  onMarkKilled?: (boss: Boss) => void;
  onSelectBoss?: (boss: Boss) => void;
}

export const HorizontalTableView: React.FC<HorizontalTableViewProps> = ({
  bosses,
  language,
  currentTime,
  filter,
  setFilter,
  onSelectBoss,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden my-3 transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[620px]">
          
          {/* Header */}
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-wider">
              
              {/* 1. TÊN BOSS TO */}
              <th className="py-3.5 px-5 min-w-[220px] text-slate-500 dark:text-slate-400">
                {t('thBoss')}
              </th>

              {/* 2. TỈ LỆ RA */}
              <th className="py-3.5 px-4 min-w-[100px] text-center text-slate-500 dark:text-slate-400">
                {t('thRate')}
              </th>

              {/* 3. THỜI GIAN RA (24H) - CỐ ĐỊNH SẮP XẾP SẮP RA LÊN ĐẦU */}
              <th className="py-3.5 px-4 min-w-[190px] select-none">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{t('thNextSpawn')}</span>
                </div>
              </th>

              {/* 4. ĐỒNG HỒ ĐẾM NGƯỢC */}
              <th className="py-3.5 px-5 min-w-[160px] text-right text-slate-500 dark:text-slate-400">
                {t('thCountdown')}
              </th>

            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {bosses.map((boss) => {
              const displayName = language === 'en' && boss.nameEn ? boss.nameEn : boss.name;

              // Countdown Calculation
              const spawnMs = boss.nextSpawnAt ? new Date(boss.nextSpawnAt).getTime() : 0;
              const diffSec = spawnMs > 0 ? Math.floor((spawnMs - now) / 1000) : 0;
              const isJustSpawned = spawnMs > 0 && diffSec <= 0 && Math.abs(diffSec) < 60;

              let countdownText = '--:--:--';
              let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';

              if (spawnMs > 0) {
                if (diffSec <= 0) {
                  const elapsedSec = Math.abs(diffSec);
                  if (elapsedSec < 60) {
                    countdownText = language === 'vi' ? 'XUẤT HIỆN' : 'SPAWN';
                    badgeColor = 'bg-emerald-600 text-white border-emerald-500 font-black animate-pulse shadow-xs';
                  } else {
                    const elapsedMins = Math.floor(elapsedSec / 60);
                    countdownText = elapsedMins > 0 
                      ? (language === 'vi' ? `ĐÃ RA (${elapsedMins}p)` : `ALIVE (${elapsedMins}m)`)
                      : (language === 'vi' ? 'ĐÃ RA' : 'ALIVE');
                    badgeColor = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-black';
                  }
                } else {
                  const hrs = Math.floor(diffSec / 3600);
                  const mins = Math.floor((diffSec % 3600) / 60);
                  const secs = diffSec % 60;
                  const pad = (n: number) => String(n).padStart(2, '0');
                  countdownText = hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;

                  if (diffSec <= 300) {
                    badgeColor = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse font-black';
                  } else if (diffSec <= 1800) {
                    badgeColor = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold';
                  } else {
                    badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-bold';
                  }
                }
              }

              return (
                <tr
                  key={boss.id}
                  className={`transition-colors ${
                    isJustSpawned 
                      ? 'bg-emerald-500/5 dark:bg-emerald-950/20 hover:bg-emerald-500/15 dark:hover:bg-emerald-950/30 border-l-4 border-l-emerald-500' 
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  
                  {/* 1. TÊN BOSS TO */}
                  <td className="py-4 px-5">
                    <div className="flex items-center space-x-3">
                      {boss.image && (
                        <img 
                          src={boss.image} 
                          alt={displayName} 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs" 
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors leading-tight">
                            {displayName}
                          </span>
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
                  </td>

                  {/* 2. TỈ LỆ RA */}
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${getSpawnRateColorClass(boss.spawnRate).badge}`}>
                      {boss.spawnRate || '100%'}
                    </span>
                  </td>

                  {/* 3. THỜI GIAN RA (24H) - HERO PROMINENT BADGE */}
                  <td className="py-4 px-4">
                    {boss.nextSpawnAt ? (
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-600/15 dark:from-amber-400/20 dark:to-amber-500/15 border-2 border-amber-500/50 dark:border-amber-400/60 shadow-xs group-hover:border-amber-500 dark:group-hover:border-amber-400 transition-all">
                        <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                        <span className="font-mono font-black text-lg sm:text-xl text-amber-700 dark:text-amber-300 tracking-wide">
                          {formatTime24h(boss.nextSpawnAt)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-sm italic">--:--:--</span>
                    )}
                  </td>

                  {/* 4. ĐỒNG HỒ ĐẾM NGƯỢC (COUNTDOWN / COOLDOWN TIMER) */}
                  <td className="py-3 px-5 text-right whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs sm:text-sm font-black font-mono tracking-wider whitespace-nowrap shadow-xs ${badgeColor}`}>
                      <Timer className="w-3.5 h-3.5 shrink-0" />
                      <span>{countdownText}</span>
                    </span>
                  </td>

                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
    </div>
  );
};
