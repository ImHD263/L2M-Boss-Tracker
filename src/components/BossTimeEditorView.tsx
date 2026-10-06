import React, { useState, useMemo } from 'react';
import { Boss, Language, SheetConfig } from '../types';
import { useAuth } from '../context/AuthContext';
import { calculateBossStatus } from '../services/sheetService';
import { updateBossToDriveApi } from '../services/sheetService';
import { Clock, ShieldAlert, Sparkles, Check, RotateCcw, Crown, Swords, Zap } from 'lucide-react';

interface BossTimeEditorViewProps {
  bosses: Boss[];
  setBosses: React.Dispatch<React.SetStateAction<Boss[]>>;
  language: Language;
  currentTime?: number;
  sheetConfig: SheetConfig;
  setToastMessage: (msg: string | null) => void;
  onOpenSheetConfig?: () => void;
}

type EditorFilter = 'all' | 'bigboss' | 'invasion' | 'local' | 'normal';

export const BossTimeEditorView: React.FC<BossTimeEditorViewProps> = ({
  bosses,
  setBosses,
  language,
  currentTime,
  sheetConfig,
  setToastMessage,
  onOpenSheetConfig,
}) => {
  const { userRole } = useAuth();
  const [activeFilter, setActiveFilter] = useState<EditorFilter>('all');
  
  // Local state for the datetime-local input of each boss: { [bossId]: 'YYYY-MM-DDTHH:mm' }
  const [inputDates, setInputDates] = useState<{ [bossId: string]: string }>({});
  const [isSaving, setIsSaving] = useState<{ [bossId: string]: boolean }>({});

  const isAuthorized = userRole === 'admin' || userRole === 'leader';
  const now = currentTime || Date.now();

  // Helper to format Respawn: e.g. 180 min -> "3h", 150 min -> "2h 30m"
  const formatRespawn = (mins: number) => {
    if (!mins || mins <= 0) return '0m';
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0 && remMins > 0) return `${hrs}h ${remMins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  // Helper to format Spawn time matching screenshot: "9/15/2026, 11:56:00 PM"
  const formatSpawnTime = (isoString: string | null) => {
    if (!isoString) return '--:--:--';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--:--';
    return d.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Helper to format Countdown matching screenshot: "00:29:53"
  const formatCountdown = (isoString: string | null) => {
    if (!isoString) return { text: '--:--:--', isAlive: false, isJustSpawned: false };
    const spawnMs = new Date(isoString).getTime();
    if (isNaN(spawnMs)) return { text: '--:--:--', isAlive: false, isJustSpawned: false };
    
    const diffSec = Math.floor((spawnMs - now) / 1000);
    if (diffSec <= 0) {
      const elapsedSec = Math.abs(diffSec);
      if (elapsedSec < 60) {
        return {
          text: language === 'vi' ? 'XUẤT HIỆN' : 'SPAWN',
          isAlive: true,
          isJustSpawned: true,
        };
      }
      const elapsedMins = Math.floor(elapsedSec / 60);
      return {
        text: elapsedMins > 0 ? `00:00:00 (${elapsedMins}m)` : '00:00:00',
        isAlive: true,
        isJustSpawned: false,
      };
    }
    const hrs = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      text: `${pad(hrs)}:${pad(mins)}:${pad(secs)}`,
      isAlive: false,
      isJustSpawned: false,
    };
  };

  // Helper to get current datetime in 'YYYY-MM-DDTHH:mm' local string
  const getNowLocalDatetimeString = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Action: Set input value to "Now"
  const handleSetTimeToNow = (bossId: string) => {
    setInputDates(prev => ({
      ...prev,
      [bossId]: getNowLocalDatetimeString(),
    }));
  };

  // Action: SAVE BOSS DIE
  const handleSaveBossDie = async (boss: Boss) => {
    setIsSaving(prev => ({ ...prev, [boss.id]: true }));

    try {
      const customInput = inputDates[boss.id];
      let killDate: Date;

      if (customInput && customInput.trim()) {
        killDate = new Date(customInput);
        if (isNaN(killDate.getTime())) {
          killDate = new Date();
        }
      } else {
        killDate = new Date();
      }

      const lastKilledAt = killDate.toISOString();
      let nextSpawnAt: string | null = null;
      if (boss.respawnMinutes > 0) {
        nextSpawnAt = new Date(killDate.getTime() + boss.respawnMinutes * 60 * 1000).toISOString();
      }

      const updatedBoss: Boss = {
        ...boss,
        lastKilledAt,
        nextSpawnAt,
        status: calculateBossStatus(nextSpawnAt),
        updateAuto: 'No',
      };

      // 1. Update React state immediately
      setBosses(prev => prev.map(b => (b.id === boss.id ? updatedBoss : b)));

      // 2. Clear input
      setInputDates(prev => {
        const next = { ...prev };
        delete next[boss.id];
        return next;
      });

      // 3. Write back to Google Drive & Backend
      const syncResult = await updateBossToDriveApi(updatedBoss, sheetConfig).catch(e => {
        console.warn('Sync to drive error:', e);
        return { success: false, driveSyncSuccess: false, message: e?.message || 'Network error' };
      });

      const displayName = language === 'en' && boss.nameEn ? boss.nameEn : boss.name;
      if (syncResult?.driveSyncSuccess) {
        setToastMessage(language === 'vi'
          ? `✅ [ĐỒNG BỘ 2 CHIỀU] Đã lưu & cập nhật trực tiếp vào Google Sheet cho Boss ${displayName}! Giờ xuất hiện mới: ${formatSpawnTime(nextSpawnAt)}`
          : `✅ [2-WAY SYNC] Saved & synced directly to Google Sheet for ${displayName}! Next spawn: ${formatSpawnTime(nextSpawnAt)}`
        );
      } else {
        setToastMessage(language === 'vi'
          ? `💾 Đã lưu giờ Boss ${displayName} vào hệ thống! (${syncResult?.message || 'Chưa gắn Webhook Google Sheet'})`
          : `💾 Saved time for ${displayName}! (${syncResult?.message || 'Webhook not connected'})`
        );
      }
    } catch (err) {
      console.error('Error saving boss die:', err);
      setToastMessage(language === 'vi' ? '❌ Có lỗi khi lưu giờ Boss' : '❌ Failed to save boss die time');
    } finally {
      setIsSaving(prev => ({ ...prev, [boss.id]: false }));
    }
  };

  // Action: NOT SPAWNED (Recalculate / advance to next respawn cycle)
  const handleNotSpawned = async (boss: Boss) => {
    setIsSaving(prev => ({ ...prev, [boss.id]: true }));

    try {
      let baseMs = boss.nextSpawnAt ? new Date(boss.nextSpawnAt).getTime() : now;
      if (isNaN(baseMs)) baseMs = now;

      const cdMs = (boss.respawnMinutes > 0 ? boss.respawnMinutes : 60) * 60 * 1000;
      
      // Advance by at least 1 cooldown cycle
      let newSpawnMs = baseMs + cdMs;
      // If it is still in the past, roll forward until future
      while (newSpawnMs <= now) {
        newSpawnMs += cdMs;
      }

      const nextSpawnAt = new Date(newSpawnMs).toISOString();

      const updatedBoss: Boss = {
        ...boss,
        nextSpawnAt,
        status: calculateBossStatus(nextSpawnAt),
        updateAuto: 'No',
        lastModifiedAt: Date.now(),
      };

      setBosses(prev => prev.map(b => (b.id === boss.id ? updatedBoss : b)));

      const syncResult = await updateBossToDriveApi(updatedBoss, sheetConfig).catch(e => {
        console.warn('Sync to drive error:', e);
        return { success: false, driveSyncSuccess: false, message: e?.message || 'Network error' };
      });

      const displayName = language === 'en' && boss.nameEn ? boss.nameEn : boss.name;
      if (syncResult?.driveSyncSuccess) {
        setToastMessage(language === 'vi'
          ? `✅ [ĐỒNG BỘ 2 CHIỀU] Đã chuyển chu kỳ và ghi trực tiếp vào Google Sheet cho ${displayName}: ${formatSpawnTime(nextSpawnAt)}!`
          : `✅ [2-WAY SYNC] Rolled & synced to Google Sheet for ${displayName}: ${formatSpawnTime(nextSpawnAt)}!`
        );
      } else {
        setToastMessage(language === 'vi'
          ? `⚡ [NOT SPAWNED] Đã chuyển giờ xuất hiện ${displayName} sang chu kỳ tiếp theo: ${formatSpawnTime(nextSpawnAt)}!`
          : `⚡ [NOT SPAWNED] Rolled ${displayName} to next spawn window: ${formatSpawnTime(nextSpawnAt)}!`
        );
      }
    } catch (err) {
      console.error('Error advancing boss not spawned:', err);
    } finally {
      setIsSaving(prev => ({ ...prev, [boss.id]: false }));
    }
  };

  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const handleSyncAllToDrive = async () => {
    setIsSyncingAll(true);
    try {
      const bossesWithTimes = bosses.filter(b => b.nextSpawnAt || b.lastKilledAt);
      let successCount = 0;
      for (const b of bossesWithTimes) {
        const res = await updateBossToDriveApi(b, sheetConfig).catch(() => null);
        if (res?.driveSyncSuccess) successCount++;
      }
      if (successCount > 0) {
        setToastMessage(language === 'vi'
          ? `🎉 Đã đồng bộ 2 chiều thành công ${successCount}/${bossesWithTimes.length} Boss lên file Google Sheet!`
          : `🎉 Successfully synced ${successCount}/${bossesWithTimes.length} bosses to Google Sheet!`
        );
      } else {
        setToastMessage(language === 'vi'
          ? `⚠️ Chưa đồng bộ được lên Google Sheet. Vui lòng bấm 'Cài đặt Webhook 2 chiều' để gắn URL Webhook Google Apps Script.`
          : `⚠️ Could not sync to Google Sheet. Please click '2-Way Webhook Setup' to connect Apps Script Webhook.`
        );
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  const localBossesCount = useMemo(() => {
    return bosses.filter(b => (b.category || 'local') === 'local').length;
  }, [bosses]);

  const invasionBossesCount = useMemo(() => {
    return bosses.filter(b => b.category === 'invasion').length;
  }, [bosses]);

  const bigBossesCount = useMemo(() => {
    return bosses.filter(b => Boolean(b.isBigBoss)).length;
  }, [bosses]);

  const normalBossesCount = useMemo(() => {
    return bosses.filter(b => !b.isBigBoss).length;
  }, [bosses]);

  // Filtered list: Mặc định hiển thị TẤT CẢ (cả Local và Invasion)
  const displayedBosses = useMemo(() => {
    return bosses
      .filter(boss => {
        if (activeFilter === 'bigboss' && !boss.isBigBoss) return false;
        if (activeFilter === 'invasion' && boss.category !== 'invasion') return false;
        if (activeFilter === 'local' && (boss.category || 'local') !== 'local') return false;
        if (activeFilter === 'normal' && boss.isBigBoss) return false;
        return true;
      })
      .sort((a, b) => {
        const timeA = a.nextSpawnAt ? new Date(a.nextSpawnAt).getTime() : 0;
        const timeB = b.nextSpawnAt ? new Date(b.nextSpawnAt).getTime() : 0;
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        const diffA = timeA - now;
        const diffB = timeB - now;

        // Giữ Boss vừa ra trong 1 phút ở đầu danh sách để dễ theo dõi
        const isJustSpawnedA = diffA <= 0 && diffA >= -60 * 1000;
        const isJustSpawnedB = diffB <= 0 && diffB >= -60 * 1000;
        if (isJustSpawnedA && !isJustSpawnedB) return -1;
        if (!isJustSpawnedA && isJustSpawnedB) return 1;
        if (isJustSpawnedA && isJustSpawnedB) return diffB - diffA;

        const isFutureA = diffA > 0;
        const isFutureB = diffB > 0;
        if (isFutureA && !isFutureB) return -1;
        if (!isFutureA && isFutureB) return 1;
        if (isFutureA && isFutureB) return diffA - diffB;
        return diffB - diffA;
      });
  }, [bosses, activeFilter, now]);

  // If not admin/leader, access denied
  if (!isAuthorized) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">
          {language === 'vi' ? 'Quyền Truy Cập Bị Hạn Chế' : 'Access Restricted'}
        </h2>
        <p className="text-slate-400 text-sm max-w-md">
          {language === 'vi' 
            ? 'Giao diện nhập giờ Boss chỉ dành riêng cho Admin và Leader. Thành viên thông thường vui lòng xem lịch tại tab Lịch Boss.' 
            : 'The Boss Time Editor interface is restricted to Admin and Leader only. Please view the schedule in Boss Tracker.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Top Banner / Title Header - Matching BOSS TIMER screenshot */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-mono">
              BOSS TIMER
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{language === 'vi' ? 'Bảng nhập giờ Boss dành cho Admin & Leader' : 'Admin & Leader Boss Time Input Panel'}</span>
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
            <span>{language === 'vi' ? 'Tổng số:' : 'Total:'} </span>
            <strong className="text-amber-400">{displayedBosses.length}</strong> / {bosses.length}
          </div>
        </div>

        {/* 2-Way Data Sync Status & Controls Bar */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sheetConfig.webhookUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                <span>{language === 'vi' ? 'Đồng bộ 2 chiều Google Sheet:' : 'Google Sheet 2-Way Sync:'}</span>
                {sheetConfig.webhookUrl ? (
                  <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">
                    🟢 {language === 'vi' ? 'Đã kết nối Webhook' : 'Webhook Active'}
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-bold">
                    🟡 {language === 'vi' ? 'Lưu an toàn máy chủ (Chưa gắn Webhook Sheet)' : 'Server Cache (Webhook not set)'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === 'vi'
                  ? 'Mọi giờ Boss nhập ở đây được bảo toàn 100% không bị ghi đè khi đồng bộ sheet và gửi thẳng về Google Sheet (Cột H, I, K, L).'
                  : 'Boss times entered here are 100% protected from overwrite and synced directly to Google Sheet.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenSheetConfig && (
              <button
                type="button"
                onClick={onOpenSheetConfig}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>⚙️ {language === 'vi' ? 'Cài đặt Webhook 2 chiều' : '2-Way Webhook Setup'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSyncAllToDrive}
              disabled={isSyncingAll}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>{isSyncingAll ? '⏳ Đang đồng bộ...' : (language === 'vi' ? '🚀 Đẩy toàn bộ lên Sheet' : '🚀 Push All to Sheet')}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar: TẤT CẢ | 👑 BIG BOSS | ⚡ INVASION | ⚔️ LOCAL BOSS | NORMAL */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* TẤT CẢ (Mặc định cả Local và Invasion) */}
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-white text-slate-950 shadow-md font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>{language === 'vi' ? 'TẤT CẢ' : 'ALL'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeFilter === 'all' ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-400'
            }`}>
              {bosses.length}
            </span>
          </button>

          {/* 👑 BIG BOSS - Keeps crown AND text BIG BOSS */}
          <button
            onClick={() => setActiveFilter('bigboss')}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'bigboss'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                : 'bg-amber-500/10 text-amber-400 hover:text-amber-300 border border-amber-500/30'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>BIG BOSS</span>
            {bigBossesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeFilter === 'bigboss' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {bigBossesCount}
              </span>
            )}
          </button>

          {/* ⚡ INVASION */}
          <button
            onClick={() => setActiveFilter('invasion')}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'invasion'
                ? 'bg-purple-600 text-white shadow-md font-black ring-1 ring-purple-300'
                : 'bg-purple-500/10 text-purple-400 hover:text-purple-300 border border-purple-500/30'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${activeFilter === 'invasion' ? 'fill-white text-white' : 'text-purple-400'}`} />
            <span>INVASION</span>
            {invasionBossesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeFilter === 'invasion' ? 'bg-white text-purple-700' : 'bg-purple-500/20 text-purple-300'
              }`}>
                {invasionBossesCount}
              </span>
            )}
          </button>

          {/* ⚔️ LOCAL BOSS */}
          <button
            onClick={() => setActiveFilter('local')}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'local'
                ? 'bg-indigo-600 text-white shadow-md font-black ring-1 ring-indigo-300'
                : 'bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>LOCAL BOSS</span>
            {localBossesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeFilter === 'local' ? 'bg-white text-indigo-700' : 'bg-indigo-500/20 text-indigo-300'
              }`}>
                {localBossesCount}
              </span>
            )}
          </button>

          {/* NORMAL */}
          <button
            onClick={() => setActiveFilter('normal')}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'normal'
                ? 'bg-white text-slate-950 shadow-md font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>NORMAL</span>
            {normalBossesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeFilter === 'normal' ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-400'
              }`}>
                {normalBossesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* List of Boss Cards - Exactly matching the vertical stack in image.png */}
      <div className="space-y-3">
        {displayedBosses.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 text-sm">
            {language === 'vi' ? 'Không tìm thấy Boss phù hợp' : 'No bosses matching criteria'}
          </div>
        ) : (
          displayedBosses.map((boss) => {
            const displayName = language === 'en' && boss.nameEn ? boss.nameEn : boss.name;
            const countdown = formatCountdown(boss.nextSpawnAt);
            const respawnText = formatRespawn(boss.respawnMinutes);
            const spawnText = formatSpawnTime(boss.nextSpawnAt);
            const saving = Boolean(isSaving[boss.id]);

            return (
              <div
                key={boss.id}
                className={`border rounded-xl p-4 sm:p-5 shadow-lg space-y-1.5 transition-all ${
                  countdown.isJustSpawned
                    ? 'bg-[#091a1e] border-emerald-500 ring-2 ring-emerald-400/50 shadow-emerald-500/20 shadow-xl'
                    : 'bg-[#0b1329] border-blue-900/60 hover:border-blue-700/80'
                }`}
              >
                {/* 1. Boss Name (Large, Bold, White) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {displayName}
                    </h3>
                    {boss.isBigBoss && (
                      <span title="Big Boss" className="p-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md inline-flex items-center justify-center shadow-xs">
                        <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      </span>
                    )}
                    {boss.category === 'invasion' && (
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-md inline-flex items-center gap-1 shadow-xs">
                        <Zap className="w-3 h-3 text-purple-400 fill-purple-400/40" />
                        <span>Invasion</span>
                      </span>
                    )}
                    {countdown.isJustSpawned && (
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-500 text-white rounded-md inline-flex items-center gap-1 animate-pulse shadow-md shadow-emerald-500/30">
                        ⚡ SPAWN
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Respawn: {X}h */}
                <div className="text-xs sm:text-sm text-slate-300/80 font-medium">
                  <span>Respawn: </span>
                  <span className="text-slate-200">{respawnText}</span>
                </div>

                {/* 3. Spawn: {date, time} */}
                <div className="text-xs sm:text-sm text-slate-300 font-medium">
                  <span>Spawn: </span>
                  <span className="text-slate-100 font-mono">{spawnText}</span>
                </div>

                {/* 4. Large Glowing Countdown: 00:29:53 */}
                <div className={`text-2xl sm:text-3xl font-mono font-bold tracking-wider pt-0.5 ${
                  countdown.isJustSpawned
                    ? 'text-emerald-400 font-black animate-pulse drop-shadow-sm'
                    : 'text-[#4d7cfe]'
                }`}>
                  {countdown.text}
                </div>

                {/* 5. Status: WAITING / SPAWNED */}
                <div className="text-xs font-black tracking-wider uppercase">
                  {countdown.isJustSpawned ? (
                    <span className="text-emerald-400 font-black animate-pulse">
                      {language === 'vi' ? '⚡ XUẤT HIỆN' : '⚡ SPAWN'}
                    </span>
                  ) : countdown.isAlive ? (
                    <span className="text-rose-400">ALIVE / SPAWNED</span>
                  ) : (
                    <span className="text-[#10b981]">WAITING</span>
                  )}
                </div>

                {/* 6. Inputs & Action Buttons Row */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {/* Datetime Input Field */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="datetime-local"
                      value={inputDates[boss.id] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInputDates(prev => ({ ...prev, [boss.id]: val }));
                      }}
                      className="bg-slate-950 border border-slate-700/80 text-white rounded-md px-2.5 py-1.5 text-xs sm:text-sm font-mono focus:outline-hidden focus:border-indigo-500 transition-colors"
                    />
                    
                    {/* Quick Now button */}
                    <button
                      type="button"
                      onClick={() => handleSetTimeToNow(boss.id)}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                      title={language === 'vi' ? 'Điền giờ hiện tại' : 'Set to current time'}
                    >
                      ⚡ Now
                    </button>
                  </div>

                  {/* SAVE BOSS DIE Button (White button with black text) */}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveBossDie(boss)}
                    className="bg-white hover:bg-slate-200 text-slate-950 font-black px-3.5 py-1.5 rounded-md text-xs sm:text-sm uppercase tracking-wide transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {saving ? 'SAVING...' : 'SAVE BOSS DIE'}
                  </button>

                  {/* NOT SPAWNED Button (White button with black text) */}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleNotSpawned(boss)}
                    className="bg-white hover:bg-slate-200 text-slate-950 font-black px-3.5 py-1.5 rounded-md text-xs sm:text-sm uppercase tracking-wide transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    NOT SPAWNED
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
