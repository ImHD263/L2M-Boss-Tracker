import React, { useState } from 'react';
import { Boss, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatRemainingTime, calculateBossStatus } from '../services/sheetService';
import { formatDateTime24h } from '../utils/timeFormat';
import { X, Clock, MapPin, Shield, CheckCircle2, Save, Trash2, RotateCcw, Crown, Zap } from 'lucide-react';
import { KillTime24hEditor } from './KillTime24hEditor';

interface BossDetailModalProps {
  boss: Boss | null;
  onClose: () => void;
  language: Language;
  onUpdateBoss: (updatedBoss: Boss) => void;
  onDeleteBoss: (bossId: string) => void;
  onMarkKilled: (boss: Boss) => void;
}

export const BossDetailModal: React.FC<BossDetailModalProps> = ({
  boss,
  onClose,
  language,
  onUpdateBoss,
  onDeleteBoss,
  onMarkKilled,
}) => {
  if (!boss) return null;

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);
  const displayName = language === 'en' && boss.nameEn ? boss.nameEn : boss.name;
  const displayMap = language === 'en' && boss.mapEn ? boss.mapEn : boss.map;

  const [notes, setNotes] = useState(boss.notes || '');
  const [cooldownMins, setCooldownMins] = useState(boss.respawnMinutes);
  const [lastKilledAt, setLastKilledAt] = useState<string | null>(boss.lastKilledAt);

  const timerInfo = formatRemainingTime(boss.nextSpawnAt, language);

  const handleSave = () => {
    let finalNextSpawnAt = boss.nextSpawnAt;

    if (lastKilledAt) {
      const parsedDate = new Date(lastKilledAt);
      if (!isNaN(parsedDate.getTime())) {
        finalNextSpawnAt = new Date(parsedDate.getTime() + cooldownMins * 60 * 1000).toISOString();
      }
    } else {
      finalNextSpawnAt = null;
    }

    const updated: Boss = {
      ...boss,
      notes,
      respawnMinutes: cooldownMins,
      lastKilledAt,
      nextSpawnAt: finalNextSpawnAt,
      status: calculateBossStatus(finalNextSpawnAt),
      updateAuto: 'No',
    };

    onUpdateBoss(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-indigo-500/50 shadow-md shrink-0 flex items-center justify-center">
              {boss.image ? (
                <img src={boss.image} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">⚔️</span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-extrabold text-xs">
                  Lv.{boss.level}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold text-xs">
                  {boss.channel}
                </span>
                {boss.isBigBoss && (
                  <span title="Big Boss" className="inline-flex items-center justify-center p-1 rounded-md text-amber-400 bg-amber-500/20 border border-amber-500/40 shadow-xs">
                    <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </span>
                )}
                {boss.category === 'invasion' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span>Invasion</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold mt-1 text-white">{displayName}</h2>
              <div className="flex items-center text-xs text-slate-300 mt-1">
                <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                <span>{displayMap}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* Main Timer Display */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
              <span>{t('thTimer')}</span>
              <span>CD: {boss.respawnMinutes} {t('minutes')}</span>
            </div>
            <div className={`text-2xl font-black font-mono flex items-center gap-2 ${
              timerInfo.isAlive ? 'text-emerald-500' : timerInfo.isSoon ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'
            }`}>
              <Clock className="w-5 h-5" />
              <span>{timerInfo.text}</span>
            </div>

            {boss.nextSpawnAt && (
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                {t('thNextSpawn')}: {formatDateTime24h(boss.nextSpawnAt)}
              </div>
            )}
          </div>

          {/* Quick Mark Killed Action */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="text-xs text-rose-700 dark:text-rose-300 font-medium">
              {language === 'vi' ? 'Diệt Boss ngay để đặt lại đếm ngược?' : 'Just killed Boss? Reset timer now.'}
            </div>
            <button
              onClick={() => {
                onMarkKilled(boss);
                onClose();
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('markKilled')}</span>
            </button>
          </div>

          {/* Edit Custom Last Kill Date - 24H Format (No AM/PM) */}
          <KillTime24hEditor
            initialIsoString={lastKilledAt}
            cooldownMinutes={cooldownMins}
            language={language}
            onChange={(newIso) => setLastKilledAt(newIso)}
          />

          {/* Edit Cooldown Minutes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('thCooldown')} ({t('minutes')})
            </label>
            <input
              type="number"
              value={cooldownMins}
              onChange={(e) => setCooldownMins(parseInt(e.target.value, 10) || 60)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Drops list */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('dropItems')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {boss.drops.map((drop, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 text-xs font-medium">
                  ✨ {drop}
                </span>
              ))}
            </div>
          </div>

          {/* Boss Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'vi' ? 'Ghi Chú & Mẹo Diệt Boss' : 'Boss Notes & Strategy'}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'vi' ? 'Nhập ghi chú hoặc chiến thuật...' : 'Enter strategy notes...'}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm(language === 'vi' ? 'Xác nhận xóa Boss này?' : 'Delete this boss entry?')) {
                onDeleteBoss(boss.id);
                onClose();
              }
            }}
            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('deleteBoss')}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t('save')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
