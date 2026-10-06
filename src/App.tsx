import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Boss, 
  Language, 
  Theme, 
  ViewMode, 
  SheetConfig, 
  FilterState
} from './types';
import { DEFAULT_BOSSES } from './data/defaultBosses';
import { 
  calculateBossStatus, 
  markBossKilled, 
  fetchSheetData, 
  extractSheetId,
  checkAndAutoRoll100PercentBoss,
  recalculateBossSpawnTime,
  recalculateAllExpiredBosses,
  updateBossToDriveApi,
  syncServerDaemonConfig,
} from './services/sheetService';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { HorizontalTableView } from './components/HorizontalTableView';
import { ScoreCardView } from './components/ScoreCardView';
import { SheetConfigModal } from './components/SheetConfigModal';
import { LoginView } from './components/LoginView';
import { AdminManagementView } from './components/AdminManagementView';
import { BossTimeEditorView } from './components/BossTimeEditorView';
import { FirstTimeInGameNameModal } from './components/FirstTimeInGameNameModal';
import { useAuth } from './context/AuthContext';
import { playBossAlertSound } from './utils/audio';
import { getTranslation } from './i18n/translations';
import { formatTime24h } from './utils/timeFormat';
import { Sparkles, RefreshCw, AlertTriangle, ExternalLink, ShieldCheck, Settings, Zap } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'boss_tracker_bosses_v3';
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr/edit?gid=663302635#gid=663302635';

export default function App() {
  const { user, userRole, isAllowed, loading } = useAuth();

  // App Core State
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      if (saved === 'vi' || saved === 'en') return saved;
    } catch (e) {}
    return 'vi';
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_language', language);
    } catch (e) {}
  }, [language]);
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('app_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  });
  const [viewMode, setViewMode] = useState<ViewMode>('table'); // 'table' or 'scorecard'
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<'tracker' | 'admin' | 'boss-editor'>('tracker');

  // Sheet Configuration State
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    try {
      const saved = localStorage.getItem('boss_tracker_sheet_config_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          autoRollMode: parsed.autoRollMode || 'all',
          syncIntervalSeconds: (parsed.syncIntervalSeconds === 30 || parsed.syncIntervalSeconds === 10) ? 14400 : (parsed.syncIntervalSeconds || 14400),
          syncStatus: 'idle',
        };
      }
    } catch (e) {}
    return {
      sheetUrl: DEFAULT_SHEET_URL,
      sheetId: extractSheetId(DEFAULT_SHEET_URL),
      sheetName: 'Sheet1',
      autoSync: true,
      autoRollMode: 'all',
      syncIntervalSeconds: 14400, // Auto sync every 4 hours (14400s)
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'idle',
    };
  });

  // Save sheetConfig changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('boss_tracker_sheet_config_v1', JSON.stringify({
        sheetUrl: sheetConfig.sheetUrl,
        sheetId: sheetConfig.sheetId,
        sheetName: sheetConfig.sheetName,
        webhookUrl: sheetConfig.webhookUrl,
        autoSync: sheetConfig.autoSync,
        autoRollMode: sheetConfig.autoRollMode || 'all',
        syncIntervalSeconds: sheetConfig.syncIntervalSeconds,
      }));
    } catch (e) {}
  }, [sheetConfig.sheetUrl, sheetConfig.sheetId, sheetConfig.sheetName, sheetConfig.webhookUrl, sheetConfig.autoSync, sheetConfig.autoRollMode, sheetConfig.syncIntervalSeconds]);

  // Đồng bộ cấu hình sang Server Daemon để máy chủ Node.js tự động chạy ngầm 24/7
  useEffect(() => {
    syncServerDaemonConfig({
      sheetUrl: sheetConfig.sheetUrl,
      sheetId: sheetConfig.sheetId,
      webhookUrl: sheetConfig.webhookUrl,
      autoRollMode: sheetConfig.autoRollMode,
      enabled: true,
    }).catch(err => console.warn('Failed to sync server daemon config:', err));
  }, [sheetConfig.sheetUrl, sheetConfig.sheetId, sheetConfig.webhookUrl, sheetConfig.autoRollMode]);

  // Boss Data State
  const [bosses, setBosses] = useState<Boss[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: Boss[] = JSON.parse(saved);
        return parsed.map(b => ({
          ...b,
          status: calculateBossStatus(b.nextSpawnAt),
        }));
      }
    } catch (e) {
      console.warn('Failed to parse local storage boss data');
    }
    return DEFAULT_BOSSES.map(b => ({
      ...b,
      status: calculateBossStatus(b.nextSpawnAt),
    }));
  });

  // Modals
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Toast Notification Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter & Search State
  const [filter, setFilter] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
    channel: 'all',
    map: 'all',
    sortBy: 'nextSpawn',
    sortOrder: 'asc',
    category: 'all',
  });

  // Live real-time clock updating every second
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Sync dark class on HTML element when theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('app_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Save bosses to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bosses));
    } catch (e) {
      console.warn('Failed to save bosses to local storage');
    }
  }, [bosses]);

  // Live Timer Ticker - Recalculates Boss Statuses & Auto-rolls bosses when spawn time arrives!
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      const rollMode = sheetConfig.autoRollMode || 'all';

      setBosses(prevBosses => {
        let hasChanges = false;
        const autoRolledBosses: Boss[] = [];

        const updated = prevBosses.map(b => {
          // Check auto-roll according to mode (all: ignores spawn rate, rolls forward when spawn time <= now)
          if (rollMode === 'all') {
            const { recalculated, updatedBoss } = recalculateBossSpawnTime(b, now);
            if (recalculated) {
              hasChanges = true;
              autoRolledBosses.push(updatedBoss);
              return updatedBoss;
            }
          } else if (rollMode === '100_only') {
            const { rolled, updatedBoss } = checkAndAutoRoll100PercentBoss(b, now);
            if (rolled) {
              hasChanges = true;
              autoRolledBosses.push(updatedBoss);
              return updatedBoss;
            }
          }

          // Normal status calculation
          const newStatus = calculateBossStatus(b.nextSpawnAt);
          if (newStatus !== b.status) {
            hasChanges = true;

            // Trigger notification alert if sound is enabled and boss spawned or is soon
            if (soundEnabled && (newStatus === 'alive' || newStatus === 'soon')) {
              playBossAlertSound(newStatus === 'alive' ? 'spawn' : 'soon');
              
              const displayName = language === 'en' && b.nameEn ? b.nameEn : b.name;
              if (newStatus === 'alive') {
                setToastMessage(`🎉 Boss ${displayName} HAS SPAWNED at ${b.map} (${b.channel})!`);
              } else if (newStatus === 'soon') {
                setToastMessage(language === 'vi' ? `⚠️ Boss ${displayName} sắp ra trong vòng 30 phút!` : `⚠️ Boss ${displayName} spawns in < 30 mins!`);
              }
            }
            return {
              ...b,
              status: newStatus,
            };
          }
          return b;
        });

        // If any boss auto-rolled, notify and push update to Google Drive Webhook/Cache
        if (autoRolledBosses.length > 0) {
          for (const rolled of autoRolledBosses) {
            const displayName = language === 'en' && rolled.nameEn ? rolled.nameEn : rolled.name;
            const rateStr = rolled.spawnRate || '100%';
            setToastMessage(language === 'vi'
              ? `⚡ Boss [${displayName}] (${rateStr}) đã đến giờ ra! Tự động tính lại chu kỳ xuất hiện mới và gửi ngược về Google Sheet.`
              : `⚡ Boss [${displayName}] (${rateStr}) reached spawn time! Recalculated next cycle & synced to Sheet.`
            );
            // Write back to Google Drive / backend cache
            updateBossToDriveApi(rolled, sheetConfig).catch((err) => {
              console.warn('Auto roll write-back error:', err);
            });
          }
        }

        return hasChanges ? updated : prevBosses;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [soundEnabled, language, sheetConfig]);

  // Clear Toast Notification automatically after 6 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Sync function to load CSV from Google Sheet via Express backend
  // In case user manually edits on Google Drive and presses Sync, Google Drive takes top priority
  const syncWithSheet = useCallback(async (customUrl?: string, isManual = false) => {
    const targetUrl = customUrl || sheetConfig.sheetUrl;
    setSheetConfig(prev => ({ ...prev, syncStatus: 'syncing' }));

    const res = await fetchSheetData(targetUrl, isManual);

    if (res.success && res.bosses && res.bosses.length > 0) {
      // 2-Way Sync Reconciler:
      // Merge Google Sheet data with local state.
      // If a boss was edited by the user in Boss Timer, preserve the user's entered spawn time!
      setBosses(prevBosses => {
        return res.bosses.map(incoming => {
          const local = prevBosses.find(b => b.id === incoming.id || b.name.toLowerCase() === incoming.name.toLowerCase());
          if (!local) return incoming;

          const localKillMs = local.lastKilledAt ? new Date(local.lastKilledAt).getTime() : 0;
          const incomingKillMs = incoming.lastKilledAt ? new Date(incoming.lastKilledAt).getTime() : 0;
          const isLocalRecentlyModified = local.lastModifiedAt && (Date.now() - local.lastModifiedAt < 86400000);

          // Only preserve local boss state if it was explicitly modified by the user in the app recently
          if (isLocalRecentlyModified && local.nextSpawnAt) {
            return {
              ...incoming,
              lastKilledAt: local.lastKilledAt,
              nextSpawnAt: local.nextSpawnAt,
              status: calculateBossStatus(local.nextSpawnAt),
              updateAuto: local.updateAuto,
              timeUpdateAuto: local.timeUpdateAuto,
              lastModifiedAt: local.lastModifiedAt,
            };
          }
          return incoming;
        });
      });
      setSelectedBoss(prevSelected => {
        if (!prevSelected) return null;
        const matching = res.bosses.find(b => b.id === prevSelected.id || b.name === prevSelected.name);
        return matching || prevSelected;
      });
      setSheetConfig(prev => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'success',
        errorMessage: undefined,
      }));

      if (isManual) {
        setToastMessage(language === 'vi'
          ? '✅ Đã đồng bộ 2 chiều thành công! Dữ liệu mới nhất từ Google Sheet và các giờ Boss bạn đã nhập đều được bảo toàn.'
          : '✅ 2-way sync successful! Live Sheet data and your entered boss times are safely preserved.'
        );
      }
      return true;
    } else {
      setSheetConfig(prev => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'error',
        errorMessage: res.message || 'Sheet restricted or unreadable',
      }));

      if (isManual) {
        setToastMessage(language === 'vi'
          ? '⚠️ Không thể tải trực tiếp từ Google Drive. Đã dùng dữ liệu lưu tạm.'
          : '⚠️ Could not reach Google Drive. Using cached data.'
        );
      }
      return false;
    }
  }, [sheetConfig.sheetUrl, language]);

  // Auto-Sync Polling Interval - runs every 30 seconds (or configured interval)
  useEffect(() => {
    if (!sheetConfig.autoSync) return;

    // Initial sync call on load / mount
    syncWithSheet();

    const intervalMs = Math.max(5, sheetConfig.syncIntervalSeconds) * 1000;
    const interval = setInterval(() => {
      syncWithSheet();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [sheetConfig.autoSync, sheetConfig.syncIntervalSeconds, syncWithSheet]);

  // Mark Boss Killed Action Handler
  const handleMarkKilled = (boss: Boss) => {
    const updatedBoss: Boss = {
      ...markBossKilled(boss),
      updateAuto: 'No',
    };
    setBosses(prev => prev.map(b => (b.id === boss.id ? updatedBoss : b)));
    
    const displayName = language === 'en' && boss.nameEn ? boss.nameEn : boss.name;
    const msg = language === 'vi'
      ? `Đã cập nhật diệt Boss ${displayName}. Thời gian ra tiếp theo: ${formatTime24h(updatedBoss.nextSpawnAt)}`
      : `Marked ${displayName} killed. Next spawn at ${formatTime24h(updatedBoss.nextSpawnAt)}`;
    
    setToastMessage(msg);

    // Sync manual death time update to backend & Google Drive
    updateBossToDriveApi(updatedBoss, sheetConfig).catch((err) => {
      console.warn('Manual kill write-back error:', err);
    });
  };

  // Update Boss Handler
  const handleUpdateBoss = (updatedBoss: Boss) => {
    setBosses(prev => prev.map(b => (b.id === updatedBoss.id ? updatedBoss : b)));
    updateBossToDriveApi(updatedBoss, sheetConfig).catch((err) => {
      console.warn('Manual edit write-back error:', err);
    });
  };

  // Delete Boss Handler
  const handleDeleteBoss = (bossId: string) => {
    setBosses(prev => prev.filter(b => b.id !== bossId));
  };

  // Tính lại giờ xuất hiện cho 1 Boss (bỏ qua giờ chết, lấy giờ xuất hiện làm mốc tính lại chu kỳ kế tiếp)
  const handleRecalculateSingleBoss = useCallback((boss: Boss) => {
    const now = Date.now();
    const { recalculated, updatedBoss } = recalculateBossSpawnTime(boss, now);
    if (!recalculated) {
      setToastMessage(language === 'vi'
        ? `ℹ️ Boss ${boss.name} chưa quá giờ xuất hiện hoặc chưa thiết lập chu kỳ hồi sinh.`
        : `ℹ️ Boss ${boss.name} has not passed spawn time or has no respawn time.`
      );
      return;
    }

    setBosses(prev => prev.map(b => b.id === boss.id ? updatedBoss : b));
    setSelectedBoss(prev => prev?.id === boss.id ? updatedBoss : prev);

    const displayName = language === 'en' && updatedBoss.nameEn ? updatedBoss.nameEn : updatedBoss.name;
    const rateStr = updatedBoss.spawnRate || '100%';
    const newTimeStr = formatTime24h(updatedBoss.nextSpawnAt);
    
    setToastMessage(language === 'vi'
      ? `⚡ Đã tính lại giờ xuất hiện cho [${displayName}] (${rateStr})! Giờ ra kế tiếp: ${newTimeStr}. Đang đồng bộ về Google Sheet...`
      : `⚡ Recalculated next spawn time for [${displayName}] (${rateStr})! Next spawn: ${newTimeStr}. Syncing to Sheet...`
    );

    updateBossToDriveApi(updatedBoss, sheetConfig).catch(e => console.warn('Failed to sync recalculated boss:', e));
  }, [language, sheetConfig]);

  // Tính lại hàng loạt cho toàn bộ Boss có giờ xuất hiện < giờ hiện tại
  const handleRecalculateAllExpired = useCallback(() => {
    const now = Date.now();
    const { updatedBosses, recalculatedCount, changedBosses } = recalculateAllExpiredBosses(bosses, now);
    if (recalculatedCount === 0) {
      setToastMessage(language === 'vi'
        ? 'ℹ️ Hiện tại không có Boss nào có giờ dự tính nhỏ hơn giờ hiện tại.'
        : 'ℹ️ No bosses currently have spawn time earlier than current time.'
      );
      return;
    }

    setBosses(updatedBosses);
    setSelectedBoss(prev => {
      if (!prev) return null;
      const found = updatedBosses.find(b => b.id === prev.id);
      return found || prev;
    });

    setToastMessage(language === 'vi'
      ? `⚡ Đã tự động tính lại giờ xuất hiện cho ${recalculatedCount} Boss (< Hiện tại)! Đang đồng bộ về Google Sheet...`
      : `⚡ Recalculated spawn times for ${recalculatedCount} bosses (< Now)! Syncing to Sheet...`
    );

    changedBosses.forEach(b => {
      updateBossToDriveApi(b, sheetConfig).catch(e => console.warn('Failed to sync recalculated boss:', e));
    });
  }, [bosses, language, sheetConfig]);

  const localBossesCount = useMemo(() => {
    return bosses.filter(b => (b.category || 'local') === 'local').length;
  }, [bosses]);

  const invasionBossesCount = useMemo(() => {
    return bosses.filter(b => b.category === 'invasion').length;
  }, [bosses]);

  const countBigBoss = useMemo(() => {
    return bosses.filter(b => Boolean(b.isBigBoss)).length;
  }, [bosses]);

  const countAll = bosses.length;

  // Đếm số lượng Boss có giờ xuất hiện nhỏ hơn giờ hiện tại (đã qua 1 phút)
  const expiredBossesCount = useMemo(() => {
    const now = currentTime || Date.now();
    return bosses.filter(b => {
      if (!b.nextSpawnAt || b.respawnMinutes <= 0) return false;
      return new Date(b.nextSpawnAt).getTime() <= (now - 60 * 1000);
    }).length;
  }, [bosses, currentTime]);

  // Extract unique maps and channels for filter dropdowns
  const uniqueMaps = useMemo(() => {
    const set = new Set<string>();
    bosses.forEach(b => set.add(language === 'en' && b.mapEn ? b.mapEn : b.map));
    return Array.from(set).sort();
  }, [bosses, language]);

  const uniqueChannels = useMemo(() => {
    const set = new Set<string>();
    bosses.forEach(b => set.add(b.channel));
    return Array.from(set).sort();
  }, [bosses]);

  // Filter & Sort bosses: Defaults to showing ALL (Both Local & Invasion)
  const filteredBosses = useMemo(() => {
    return bosses
      .filter(boss => {
        const displayName = (language === 'en' && boss.nameEn ? boss.nameEn : boss.name).toLowerCase();
        const displayMap = (language === 'en' && boss.mapEn ? boss.mapEn : boss.map).toLowerCase();
        const query = filter.searchQuery.toLowerCase().trim();

        // Category Filter (Default 'all' shows both Local and Invasion)
        if (filter.category === 'invasion' && boss.category !== 'invasion') {
          return false;
        }
        if (filter.category === 'local' && (boss.category || 'local') !== 'local') {
          return false;
        }

        // Big Boss Filter
        if (filter.bigBossOnly && !boss.isBigBoss) {
          return false;
        }

        // Search Filter
        if (query) {
          const matchName = displayName.includes(query) || boss.name.toLowerCase().includes(query);
          const matchMap = displayMap.includes(query);
          const matchChannel = boss.channel.toLowerCase().includes(query);
          const matchDrops = boss.drops.some(d => d.toLowerCase().includes(query));
          if (!matchName && !matchMap && !matchChannel && !matchDrops) return false;
        }

        // Status Filter
        if (filter.status !== 'all' && boss.status !== filter.status) return false;

        // Map Filter
        if (filter.map !== 'all') {
          const currentDisplayMap = language === 'en' && boss.mapEn ? boss.mapEn : boss.map;
          if (currentDisplayMap !== filter.map && boss.map !== filter.map) return false;
        }

        // Channel Filter
        if (filter.channel !== 'all' && boss.channel !== filter.channel) return false;

        return true;
      })
      .sort((a, b) => {
        // LUÔN SẮP BOSS SẮP RA Ở TRÊN CÙNG (CỐ ĐỊNH MẶC ĐỊNH, KHÔNG CHO THAY ĐỔI)
        if (!a.nextSpawnAt && !b.nextSpawnAt) return 0;
        if (!a.nextSpawnAt) return 1;
        if (!b.nextSpawnAt) return -1;
        const timeA = new Date(a.nextSpawnAt).getTime();
        const timeB = new Date(b.nextSpawnAt).getTime();
        const diffA = timeA - currentTime;
        const diffB = timeB - currentTime;

        // 1. Boss vừa đến giờ ra trong vòng 1 phút (diff <= 0 và diff >= -60s):
        // GIỮ NGUYÊN Ở TRÊN CÙNG với trạng thái SPAWN (XUẤT HIỆN) để tiện theo dõi
        const isJustSpawnedA = diffA <= 0 && diffA >= -60 * 1000;
        const isJustSpawnedB = diffB <= 0 && diffB >= -60 * 1000;

        if (isJustSpawnedA && !isJustSpawnedB) return -1;
        if (!isJustSpawnedA && isJustSpawnedB) return 1;
        if (isJustSpawnedA && isJustSpawnedB) return diffB - diffA; // Boss mới xuất hiện gần hơn lên trước

        // 2. Boss sắp ra trong tương lai (diff > 0): LUÔN SẮP BOSS SẮP RA Ở TRÊN CÙNG (diff nhỏ hơn xếp trước!)
        const isFutureA = diffA > 0;
        const isFutureB = diffB > 0;
        if (isFutureA && !isFutureB) return -1; // Boss sắp ra luôn xếp trước boss đã qua
        if (!isFutureA && isFutureB) return 1;  // Boss đã qua xếp sau
        if (isFutureA && isFutureB) return diffA - diffB; // Boss sắp ra sớm nhất (1m, 5m, 10m...) lên đầu!

        // 3. Boss đã qua hơn 1 phút: xếp ở dưới cùng
        return diffB - diffA;
      });
  }, [bosses, filter, language, currentTime]);

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  // 1. Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center animate-bounce shadow-lg shadow-indigo-500/50">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="text-xs font-semibold text-slate-400 animate-pulse">
          Đang xác thực tài khoản Google...
        </div>
      </div>
    );
  }

  // 2. Authentication Check (Not Logged in OR Not Allowed)
  if (!user || !isAllowed) {
    return <LoginView language={language} />;
  }

  // 3. Authenticated App Screen
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/50 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header */}
      <Header
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sheetConfig={sheetConfig}
        onSyncNow={() => syncWithSheet(undefined, true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        
        {currentTab === 'admin' ? (
          <AdminManagementView language={language} />
        ) : currentTab === 'boss-editor' ? (
          <BossTimeEditorView
            bosses={bosses}
            setBosses={setBosses}
            language={language}
            currentTime={currentTime}
            sheetConfig={sheetConfig}
            setToastMessage={setToastMessage}
            onOpenSheetConfig={() => setIsConfigOpen(true)}
          />
        ) : (
          <>
            {/* Compact Warning if Sheet needs permission */}
            {sheetConfig.syncStatus === 'error' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    {language === 'vi' 
                      ? 'Chưa kết nối trực tiếp Sheet (Hãy mở quyền xem công khai)' 
                      : 'Sheet not directly accessible (Make link public)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsConfigOpen(true)}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {language === 'vi' ? 'Cài đặt Sheet' : 'Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* Clean, Simple Filter Bar with Quick All / Big Boss / Invasion / Local Boss Filters */}
            <FilterBar
              filter={filter}
              setFilter={setFilter}
              language={language}
              countAll={countAll}
              countBigBoss={countBigBoss}
              countInvasion={invasionBossesCount}
              countLocal={localBossesCount}
            />

            {/* Quick compact button for expired bosses */}
            {expiredBossesCount > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  ⚡ {language === 'vi' ? `Có ${expiredBossesCount} Boss đã đến giờ xuất hiện` : `${expiredBossesCount} Bosses reached spawn time`}
                </span>
                <button
                  onClick={handleRecalculateAllExpired}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs transition-colors"
                >
                  {language === 'vi' ? `Tính lại giờ (${expiredBossesCount})` : `Recalculate (${expiredBossesCount})`}
                </button>
              </div>
            )}

            {/* Main Display: ONLY Big Boss Name, Spawn Time, Spawn Rate & Countdown Timer */}
            {viewMode === 'table' ? (
              <HorizontalTableView
                bosses={filteredBosses}
                language={language}
                currentTime={currentTime}
                filter={filter}
                setFilter={setFilter}
              />
            ) : (
              <ScoreCardView
                bosses={filteredBosses}
                language={language}
                currentTime={currentTime}
              />
            )}
          </>
        )}

      </main>


      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            ⚔️ <b>Boss Schedule & Timer Tracker</b> • Sync directly with Google Sheets
          </div>
          <div className="flex items-center space-x-3">
            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => setIsConfigOpen(true)}
                  className="hover:underline text-indigo-600 dark:text-indigo-400 cursor-pointer"
                >
                  {t('sheetConfig')}
                </button>
                <span>•</span>
              </>
            )}
            <button
              onClick={() => syncWithSheet()}
              className="hover:underline text-emerald-600 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('syncSheet')}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {userRole === 'admin' && (
        <SheetConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          config={sheetConfig}
          onSaveConfig={(cfg) => setSheetConfig(cfg)}
          language={language}
          onTestSync={syncWithSheet}
        />
      )}

      {/* Force prompt In-Game Name if user hasn't set one yet */}
      <FirstTimeInGameNameModal language={language} />

    </div>
  );
}
