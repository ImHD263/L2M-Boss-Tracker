import React from 'react';
import { 
  Table, 
  LayoutGrid, 
  Globe, 
  Sun, 
  Moon, 
  RefreshCw, 
  Settings, 
  Volume2, 
  VolumeX, 
  PlusCircle, 
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clipboard,
  Shield,
  LogOut,
  UserCheck,
  Timer
} from 'lucide-react';
import { Language, Theme, ViewMode, SheetConfig } from '../types';
import { getTranslation } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';
import { formatTime24h } from '../utils/timeFormat';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sheetConfig: SheetConfig;
  onSyncNow: () => void;
  onOpenConfig: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  currentTab: 'tracker' | 'admin' | 'boss-editor';
  setCurrentTab: (tab: 'tracker' | 'admin' | 'boss-editor') => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  theme,
  setTheme,
  viewMode,
  setViewMode,
  sheetConfig,
  onSyncNow,
  onOpenConfig,
  soundEnabled,
  setSoundEnabled,
  currentTab,
  setCurrentTab,
}) => {
  const { user, userRole, logout, currentUserRecord } = useAuth();
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const isCanManageUsers = userRole === 'admin' || userRole === 'leader';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* App Branding & Navigation Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-amber-400 font-bold text-xl">
                  ⚔️
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  {t('appTitle')}
                </h1>
                
                {/* Navigation Tabs (Tracker vs Boss Editor vs Admin) */}
                <div className="flex items-center space-x-2 mt-1">
                  <button
                    onClick={() => setCurrentTab('tracker')}
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-lg transition-all ${
                      currentTab === 'tracker'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {language === 'vi' ? '⚔️ Lịch Boss' : '⚔️ Boss Tracker'}
                  </button>

                  {isCanManageUsers && (
                    <button
                      onClick={() => setCurrentTab('boss-editor')}
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                        currentTab === 'boss-editor'
                          ? 'bg-amber-500 text-white font-black shadow-xs'
                          : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                      }`}
                    >
                      <Timer className="w-3 h-3" />
                      <span>{language === 'vi' ? '⏱️ Nhập Giờ Boss' : '⏱️ Input Boss Time'}</span>
                    </button>
                  )}

                  {isCanManageUsers && (
                    <button
                      onClick={() => setCurrentTab('admin')}
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                        currentTab === 'admin'
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      <span>{language === 'vi' ? '🔒 Quản Lý Quyền' : '🔒 Admin Access'}</span>
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Mobile Controls */}
            <div className="flex md:hidden items-center space-x-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={soundEnabled ? t('soundOn') : t('soundOff')}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
            </div>
          </div>

          {/* Controls & User Profile */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* View Mode Switcher (When on tracker) */}
            {currentTab === 'tracker' && (
              <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700/60">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>{t('horizontalTable')}</span>
                </button>
                <button
                  onClick={() => setViewMode('scorecard')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'scorecard'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{t('scoreCardView')}</span>
                </button>
              </div>
            )}

            {currentTab === 'tracker' && (
              <>
                {/* Sync Sheet Button */}
                <button
                  onClick={onSyncNow}
                  disabled={sheetConfig.syncStatus === 'syncing'}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sheetConfig.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">
                    {sheetConfig.syncStatus === 'syncing' ? t('syncing') : t('syncSheet')}
                  </span>
                </button>

                {/* Sheet Settings Modal Button - Always visible so user can configure Webhook & Sheet */}
                <button
                  onClick={onOpenConfig}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition-colors border border-purple-300 dark:border-purple-700 shadow-xs cursor-pointer"
                  title={language === 'vi' ? 'Cài đặt Google Sheet & Webhook đồng bộ (Cột K & L)' : 'Google Sheet & Webhook Settings'}
                >
                  <Settings className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-[spin_10s_linear_infinite]" />
                  <span>{language === 'vi' ? '⚙️ Cài đặt Sheet' : '⚙️ Sheet Setup'}</span>
                </button>
              </>
            )}

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              title={language === 'vi' ? 'Chuyển sang Tiếng Anh (English)' : 'Chuyển sang Tiếng Việt'}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>{language === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hidden md:flex items-center p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* User Profile Pill & Logout */}
            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User Avatar" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate" title={currentUserRecord?.inGameName ? `IGN: ${currentUserRecord.inGameName} (${user.email})` : user.email || ''}>
                    {currentUserRecord?.inGameName ? currentUserRecord.inGameName : (user.displayName || user.email?.split('@')[0])}
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                    {userRole}
                  </span>
                </div>

                <button
                  onClick={() => logout()}
                  className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-rose-500/20 cursor-pointer"
                  title={language === 'vi' ? 'Đăng xuất' : 'Sign out'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Sync Status bar */}
        {currentTab === 'tracker' && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 font-mono">
                <Clock className="w-3 h-3 text-indigo-500" />
                {t('lastSynced')}: {sheetConfig.lastSyncedAt ? formatTime24h(sheetConfig.lastSyncedAt) : t('now')}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              {sheetConfig.syncStatus === 'success' && (
                <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Google Sheet Connected</span>
                </span>
              )}
              {sheetConfig.syncStatus === 'error' && (
                <span className="inline-flex items-center text-amber-600 dark:text-amber-400 gap-1 font-medium" title={sheetConfig.errorMessage}>
                  <AlertCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Cached Mode</span>
                </span>
              )}
              {sheetConfig.autoSync && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 font-mono text-[10px]">
                  Auto: {sheetConfig.syncIntervalLabel || '30s'}
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

