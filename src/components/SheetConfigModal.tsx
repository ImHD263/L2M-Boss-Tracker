import React, { useState, useEffect } from 'react';
import { SheetConfig, Language, AutoRollMode, ServerDaemonStatus } from '../types';
import { getTranslation } from '../i18n/translations';
import { extractSheetId, fetchServerDaemonStatus, syncServerDaemonConfig } from '../services/sheetService';
import { X, Settings, RefreshCw, CheckCircle2, AlertCircle, Link, FileText, Globe, CloudUpload, Download, Copy, Check, Send, Zap, Clock, ShieldCheck, Activity } from 'lucide-react';

interface SheetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetConfig;
  onSaveConfig: (updatedConfig: SheetConfig) => void;
  language: Language;
  onTestSync: (sheetUrl: string) => Promise<boolean>;
}

export const SheetConfigModal: React.FC<SheetConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  language,
  onTestSync,
}) => {
  if (!isOpen) return null;

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const [sheetUrl, setSheetUrl] = useState(config.sheetUrl);
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [syncInterval, setSyncInterval] = useState(config.syncIntervalSeconds);
  const [autoRollMode, setAutoRollMode] = useState<AutoRollMode>(config.autoRollMode || 'all');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showScriptGuide, setShowScriptGuide] = useState(true);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [daemonStatus, setDaemonStatus] = useState<ServerDaemonStatus | null>(null);
  const [isTriggeringDaemon, setIsTriggeringDaemon] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchServerDaemonStatus().then(status => {
        if (status) setDaemonStatus(status);
      });
    }
  }, [isOpen]);

  const handleTriggerDaemonNow = async () => {
    setIsTriggeringDaemon(true);
    try {
      const res = await fetch('/api/server-daemon/trigger-now', { method: 'POST' });
      await res.json();
      const updated = await fetchServerDaemonStatus();
      if (updated) setDaemonStatus(updated);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsTriggeringDaemon(false);
    }
  };

  const sheetId = extractSheetId(sheetUrl);

  const APPS_SCRIPT_CODE = `// =========================================================================================
// GOOGLE APPS SCRIPT: TỰ ĐỘNG CHẠY 24/7 TRÊN GOOGLE DRIVE (KỂ CẢ KHI TẮT MÁY / TẮT WEB)
// =========================================================================================

// 1. NHẬN YÊU CẦU ĐỒNG BỘ 2 CHIỀU TỪ WEB HOẶC MÁY CHỦ NODE.JS
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      var targetId = data.sheetId || "${sheetId || '1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr'}";
      ss = SpreadsheetApp.openById(targetId);
    }
    
    // Tìm đúng tab sheet: "Invasion" hoặc "Boss" (Local)
    var targetSheetName = data.sheetName || (data.category === 'invasion' ? 'Invasion' : null);
    var sheet = targetSheetName ? ss.getSheetByName(targetSheetName) : null;
    if (!sheet) {
      if (data.category === 'invasion') {
        sheet = ss.getSheetByName('Invasion') || ss.getSheetByName('invasion');
      } else {
        sheet = ss.getSheetByName('Boss') || ss.getSheetByName('boss') || ss.getSheetByName('Local') || ss.getSheetByName('Sheet1');
      }
    }
    if (!sheet) {
      sheet = ss.getActiveSheet();
    }
    
    // Tự động kiểm tra & gắn tiêu đề Cột K (cột 11) và Cột L (cột 12) nếu trống
    var headerK = sheet.getRange(1, 11).getValue();
    if (!headerK || headerK.toString().trim() === '') {
      sheet.getRange(1, 11).setValue('Update Auto');
    }
    var headerL = sheet.getRange(1, 12).getValue();
    if (!headerL || headerL.toString().trim() === '') {
      sheet.getRange(1, 12).setValue('Time Update Auto');
    }

    var rows = sheet.getDataRange().getValues();
    var found = false;
    var targetName = (data.bossName || '').toString().toLowerCase().trim();
    var targetNameEn = (data.bossNameEn || '').toString().toLowerCase().trim();

    for (var i = 1; i < rows.length; i++) {
      var rowName = (rows[i][1] || '').toString().toLowerCase().trim(); // Cột B: Tên Boss
      var rowNameEn = (rows[i][2] || '').toString().toLowerCase().trim(); // Cột C: Boss name (English)

      if (rowName === targetName || (targetNameEn && rowNameEn === targetNameEn)) {
        var rowNum = i + 1; // Dòng thực tế trên Sheet

        // Cột H (Cột 8): Thời Gian chết
        if (data.lastKilledTime || data.lastKilledAt) {
          var kTime = data.lastKilledTime || Utilities.formatDate(new Date(data.lastKilledAt), "Asia/Ho_Chi_Minh", "HH:mm:ss");
          sheet.getRange(rowNum, 8).setValue(kTime);
        }

        // Cột I (Cột 9): Xuất Hiện (Giờ boss ra tiếp theo)
        if (data.nextSpawnTime || data.nextSpawnAt) {
          var sTime = data.nextSpawnTime || Utilities.formatDate(new Date(data.nextSpawnAt), "Asia/Ho_Chi_Minh", "HH:mm:ss");
          sheet.getRange(rowNum, 9).setValue(sTime);
        }

        // Cột K (Cột 11): Update Auto (Yes / No)
        sheet.getRange(rowNum, 11).setValue(data.updateAuto || 'No');

        // Cột L (Cột 12): Time Update Auto (Thời điểm cập nhật)
        var autoTime = data.timeUpdateAuto || Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "HH:mm:ss dd/MM/yyyy");
        sheet.getRange(rowNum, 12).setValue(autoTime);

        found = true;
        break;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      found: found,
      sheetUsed: sheet.getName(),
      bossName: data.bossName,
      message: found ? "Đã cập nhật 2 chiều thành công Cột H, I, K, L trên sheet " + sheet.getName() : "Không tìm thấy tên Boss trên Sheet " + sheet.getName()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. HÀM TỰ ĐỘNG QUÉT & TÍNH LẠI GIỜ XUẤT HIỆN TRỰC TIẾP TRÊN GOOGLE CLOUD
// (Bỏ qua giờ chết, lấy giờ xuất hiện làm mốc tính chu kỳ mới khi < giờ hiện tại)
function autoCheckAndRollBosses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    var defaultId = "${sheetId || '1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr'}";
    ss = SpreadsheetApp.openById(defaultId);
  }
  var sheet = ss.getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return;

  var now = new Date();
  var nowMs = now.getTime();
  var tz = "Asia/Ho_Chi_Minh";

  if (!sheet.getRange(1, 11).getValue()) sheet.getRange(1, 11).setValue('Update Auto');
  if (!sheet.getRange(1, 12).getValue()) sheet.getRange(1, 12).setValue('Time Update Auto');

  for (var i = 1; i < rows.length; i++) {
    var bossName = rows[i][1];
    if (!bossName) continue;

    // Cột J (Index 9): Cooldown hồi sinh (ví dụ "3:00:00" hoặc phút)
    var rawCd = rows[i][9];
    var cdMinutes = 0;
    if (typeof rawCd === 'number') {
      cdMinutes = rawCd > 1 ? rawCd : Math.round(rawCd * 24 * 60);
    } else if (typeof rawCd === 'string') {
      var m = rawCd.match(/^(\\d+):(\\d+)/);
      if (m) cdMinutes = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
      else cdMinutes = parseInt(rawCd, 10) || 0;
    }
    if (cdMinutes <= 0) continue;

    // Cột I (Index 8): Giờ xuất hiện dự kiến
    var rawSpawn = rows[i][8];
    if (!rawSpawn) continue;

    var spawnDate = null;
    if (rawSpawn instanceof Date) {
      spawnDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), rawSpawn.getHours(), rawSpawn.getMinutes(), rawSpawn.getSeconds());
    } else if (typeof rawSpawn === 'string') {
      var sm = rawSpawn.match(/(\\d{1,2})[:h](\\d{2})(?:[:m](\\d{2}))?/);
      if (sm) {
        spawnDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(sm[1], 10), parseInt(sm[2], 10), sm[3] ? parseInt(sm[3], 10) : 0);
      }
    }

    if (!spawnDate) continue;
    var spawnMs = spawnDate.getTime();

    // Nếu giờ xuất hiện <= hiện tại: Tự tính tiếp chu kỳ kế tiếp
    if (nowMs >= spawnMs) {
      var cdMs = cdMinutes * 60 * 1000;
      var cycleMs = spawnMs;
      var lastCycleMs = spawnMs;
      while (cycleMs <= nowMs && cdMs > 0) {
        lastCycleMs = cycleMs;
        cycleMs += cdMs;
      }

      var rowNum = i + 1;
      var newKillStr = Utilities.formatDate(new Date(lastCycleMs), tz, "HH:mm:ss");
      var newSpawnStr = Utilities.formatDate(new Date(cycleMs), tz, "HH:mm:ss");
      var autoTimeStr = Utilities.formatDate(now, tz, "HH:mm:ss dd/MM/yyyy");

      sheet.getRange(rowNum, 8).setValue(newKillStr);
      sheet.getRange(rowNum, 9).setValue(newSpawnStr);
      sheet.getRange(rowNum, 11).setValue('Yes');
      sheet.getRange(rowNum, 12).setValue(autoTimeStr);
    }
  }
}

// 3. CÀI ĐẶT TRIGGER TỰ ĐỘNG CHẠY MỖI 1 PHÚT TRÊN ĐÁM MÂY GOOGLE
// (Chỉ cần chọn hàm installAutoTrigger và bấm nút Run/Chạy trong trình soạn thảo Apps Script 1 lần duy nhất)
function installAutoTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'autoCheckAndRollBosses') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('autoCheckAndRollBosses')
    .timeBased()
    .everyMinutes(1)
    .create();
};`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      setWebhookTestResult({
        success: false,
        message: 'Vui lòng nhập Webhook URL hợp lệ (bắt đầu bằng https://script.google.com/macros/s/...)',
      });
      return;
    }

    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    try {
      const res = await fetch('/api/sheet-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetUrl,
          sheetId,
          webhookUrl,
          boss: {
            id: 'test-boss',
            name: 'Tinh Linh',
            nameEn: 'Olkuth',
            channel: 'Kênh 1',
            map: 'Điện Thần Tinh Linh',
            respawnMinutes: 0,
            lastKilledAt: new Date().toISOString(),
            nextSpawnAt: new Date(Date.now() + 3600000).toISOString(),
            updateAuto: 'Yes',
            timeUpdateAuto: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
          },
        }),
      });

      const data = await res.json();
      if (data.driveSyncSuccess) {
        setWebhookTestResult({
          success: true,
          message: '✅ Kết nối thành công! Đã gửi thử bản ghi cập nhật Cột H, I, K, L vào Google Sheet của bạn!',
        });
      } else {
        setWebhookTestResult({
          success: false,
          message: data.message || '⚠️ Google Sheet Webhook phản hồi không thành công.',
        });
      }
    } catch (err: any) {
      setWebhookTestResult({
        success: false,
        message: `Lỗi kết nối Webhook: ${err.message}`,
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await onTestSync(sheetUrl);
      if (ok) {
        setTestResult({
          success: true,
          message: t('syncSuccessMsg'),
        });
      } else {
        setTestResult({
          success: false,
          message: t('syncErrorMsg'),
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || t('syncErrorMsg'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    let intervalLabel = '30s';
    if (syncInterval === 10) intervalLabel = t('sec10');
    else if (syncInterval === 30) intervalLabel = t('sec30');
    else if (syncInterval === 60) intervalLabel = t('min1');
    else if (syncInterval === 300) intervalLabel = t('min5');

    onSaveConfig({
      ...config,
      sheetUrl,
      sheetId,
      webhookUrl: webhookUrl.trim() || undefined,
      autoSync,
      syncIntervalSeconds: syncInterval,
      autoRollMode,
      // @ts-ignore
      syncIntervalLabel: intervalLabel,
    });

    // Đồng bộ cấu hình sang máy chủ Node.js để chạy ngầm 24/7
    syncServerDaemonConfig({
      sheetUrl,
      sheetId,
      webhookUrl: webhookUrl.trim() || undefined,
      autoRollMode,
      enabled: true,
    }).catch(e => console.warn('Failed to sync server daemon config:', e));

    onClose();
  };

  const handleRestoreDefault = () => {
    const defaultUrl = 'https://docs.google.com/spreadsheets/d/1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr/edit?gid=663302635#gid=663302635';
    setSheetUrl(defaultUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">{t('configTitle')}</h2>
              <p className="text-xs text-slate-300">{t('configSubtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Active Sheet Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('sheetUrlLabel')}</span>
            </label>
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr/..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              {t('sheetUrlHelp')}
            </p>
          </div>

          {/* Sheet ID info */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">{t('currentSheetId')}:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[220px]">
              {sheetId}
            </span>
          </div>

          {/* Auto Sync Toggle & Interval */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('autoSyncToggle')}
                </div>
                <div className="text-[11px] text-slate-400">
                  {language === 'vi' ? 'Tự động tải lại khi Google Sheet có thay đổi' : 'Auto reload when Google Sheet changes'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {autoSync && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('syncIntervalLabel')}
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { sec: 30, label: t('sec30') },
                    { sec: 60, label: t('min1') },
                    { sec: 300, label: t('min5') },
                    { sec: 3600, label: t('hour1') },
                    { sec: 14400, label: t('hours4') },
                  ].map((item) => (
                    <button
                      key={item.sec}
                      type="button"
                      onClick={() => setSyncInterval(item.sec)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all border ${
                        syncInterval === item.sec
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test API connection */}
          <div>
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-500 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? t('syncing') : t('testConnection')}</span>
            </button>

            {testResult && (
              <div className={`mt-2 p-3 rounded-xl text-xs font-medium flex items-start space-x-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Chế độ tự động tính lại giờ xuất hiện (< Giờ hiện tại) */}
          <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{language === 'vi' ? 'Tính Lại Giờ Boss Xuất Hiện (< Hiện Tại)' : 'Auto-Roll Expired Spawn Times (< Now)'}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                {language === 'vi' ? 'Logic Chu Kỳ' : 'Cycle Logic'}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'vi'
                ? 'Lấy giờ dự tính xuất hiện, bỏ qua giờ chết và tự động cộng dồn chu kỳ hồi sinh (cooldown) khi giờ xuất hiện nhỏ hơn giờ hiện tại để tìm mốc xuất hiện tiếp theo.'
                : 'Takes expected spawn time, ignores death time, and rolls forward by cooldown cycle when spawn time < current time.'}
            </p>

            <div className="grid grid-cols-1 gap-1.5 pt-1">
              <label
                onClick={() => setAutoRollMode('all')}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  autoRollMode === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    autoRollMode === 'all' ? 'border-white bg-white' : 'border-slate-400'
                  }`}>
                    {autoRollMode === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold">
                      {language === 'vi' ? 'Tất cả Boss (Không quan tâm % tỷ lệ) - Khuyên dùng' : 'All Bosses (Ignore spawn rate %) - Recommended'}
                    </div>
                    <div className={`text-[10px] ${autoRollMode === 'all' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {language === 'vi' ? 'Áp dụng chung mọi tỷ lệ (33%, 50%, 70%, 100%)' : 'Applies to all spawn rates (33%, 50%, 70%, 100%)'}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${autoRollMode === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  Mặc định
                </span>
              </label>

              <label
                onClick={() => setAutoRollMode('100_only')}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  autoRollMode === '100_only'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    autoRollMode === '100_only' ? 'border-white bg-white' : 'border-slate-400'
                  }`}>
                    {autoRollMode === '100_only' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold">
                      {language === 'vi' ? 'Chỉ Boss tỷ lệ 100%' : '100% Bosses Only'}
                    </div>
                    <div className={`text-[10px] ${autoRollMode === '100_only' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {language === 'vi' ? 'Chỉ tính lại tự động cho Boss có spawn rate 100%' : 'Only recalculate for 100% spawn rate'}
                    </div>
                  </div>
                </div>
              </label>

              <label
                onClick={() => setAutoRollMode('disabled')}
                className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  autoRollMode === 'disabled'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    autoRollMode === 'disabled' ? 'border-white bg-white' : 'border-slate-400'
                  }`}>
                    {autoRollMode === 'disabled' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold">
                      {language === 'vi' ? 'Tắt tự động tính lại' : 'Disable auto recalculation'}
                    </div>
                    <div className={`text-[10px] ${autoRollMode === 'disabled' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {language === 'vi' ? 'Chỉ tính lại khi bấm thủ công' : 'Only recalculate on manual click'}
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 24/7 Server Daemon Status Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-indigo-500/10 border border-emerald-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{language === 'vi' ? 'Máy Chủ Chạy Ngầm 24/7 (Kể cả khi tắt app / tắt máy)' : '24/7 Background Server Daemon'}</span>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                {language === 'vi' ? 'ĐANG CHẠY NGẦM' : 'RUNNING 24/7'}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'vi'
                ? 'Khi bạn đóng trình duyệt hoặc không có ai truy cập web, máy chủ Node.js vẫn chạy độc lập và quét mỗi 10 giây. Khi boss tới/quá giờ xuất hiện, máy chủ sẽ tự động tính lại giờ mới theo chu kỳ và bắn Webhook ghi vào Cột H, I, K, L trên Google Sheet!'
                : 'When you close the browser tab or device, the Node.js server still runs independently in background every 10s. It recalculates the next spawn cycle and syncs to Google Sheet.'}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-emerald-500/15">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'vi' ? 'Đã tự cuộn chu kỳ:' : 'Auto-rolled count:'}
                </div>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {daemonStatus?.totalAutoRolledCount ?? 0} {language === 'vi' ? 'lần' : 'times'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-emerald-500/15">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'vi' ? 'Lần quét gần nhất:' : 'Last scan:'}
                </div>
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-1 truncate">
                  {daemonStatus?.lastRunAt ? new Date(daemonStatus.lastRunAt).toLocaleTimeString('vi-VN', { hour12: false }) : (language === 'vi' ? 'Vừa xong' : 'Just now')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTriggerDaemonNow}
              disabled={isTriggeringDaemon}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isTriggeringDaemon ? 'animate-spin' : ''}`} />
              <span>{isTriggeringDaemon ? (language === 'vi' ? 'Đang kích hoạt...' : 'Triggering...') : (language === 'vi' ? 'Kích hoạt máy chủ quét & cuộn giờ ngay lập tức' : 'Trigger Server Scan Now')}</span>
            </button>
          </div>

          {/* Webhook Google Apps Script để update ngược về Google Drive */}
          <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
                <CloudUpload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>API Cập Nhật Ngược Về File Google Drive / Sheet</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300">
                2 Cột: Update Auto & Time Auto
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Webhook URL Google Apps Script (Ghi 2 chiều về Google Sheet):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook || !webhookUrl}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {isTestingWebhook ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Test gửi thử</span>
                </button>
              </div>

              {webhookTestResult && (
                <div
                  className={`mt-2 p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                    webhookTestResult.success
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {webhookTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <span>{webhookTestResult.message}</span>
                </div>
              )}

              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Khi cập nhật giờ trên web hoặc khi Boss 100% tự động cuộn giờ, hệ thống sẽ ghi trực tiếp vào file Google Sheet của bạn tại <b>Cột H (Giờ chết), Cột I (Giờ ra), Cột K (Update Auto), Cột L (Time Update Auto)</b>.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-500/15">
              <button
                type="button"
                onClick={() => setShowScriptGuide(!showScriptGuide)}
                className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>{showScriptGuide ? '▼ Ẩn hướng dẫn cài đặt Google Apps Script' : '▶ Hướng dẫn gắn mã vào Google Sheet để nhận dữ liệu (Cột K & L)'}</span>
              </button>
              <a
                href="/api/export-csv"
                download="boss_schedule_columns_A_to_L.csv"
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file CSV chuẩn (Cột A - L)</span>
              </a>
            </div>

            {showScriptGuide && (
              <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono space-y-2.5 border border-slate-800">
                <div className="flex items-center justify-between font-sans">
                  <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Cách kích hoạt ghi tự động & tạo Cột K, L trên Google Sheet:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-sans font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Đã sao chép!' : 'Sao chép mã'}</span>
                  </button>
                </div>
                <ol className="list-decimal pl-4 font-sans text-[11px] space-y-1 text-slate-300">
                  <li>Mở Google Sheet của bạn → Vào menu <b>Tiện ích mở rộng (Extensions)</b> → Chọn <b>Apps Script</b>.</li>
                  <li>Xóa toàn bộ mã cũ, dán đoạn mã bên dưới vào và bấm <b>Lưu (Ctrl+S)</b>.</li>
                  <li>Bấm nút <b>Triển khai (Deploy)</b> (góc phải trên) → Chọn <b>Triển khai mới (New deployment)</b>.</li>
                  <li>Bấm biểu tượng bánh răng ⚙️ cạnh "Chọn loại", chọn <b>Ứng dụng web (Web app)</b>.</li>
                  <li>Tại mục "Ai có quyền truy cập (Who has access)", bắt buộc chọn <b>Bất kỳ ai (Anyone)</b>.</li>
                  <li>Bấm <b>Triển khai (Deploy)</b>, sao chép liên kết URL Web App và dán vào ô Webhook URL ở trên.</li>
                </ol>
                <div className="relative">
                  <pre className="p-3 bg-slate-950 rounded-xl text-[10px] text-emerald-400 overflow-x-auto select-all max-h-48">
{APPS_SCRIPT_CODE}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Quy tắc ưu tiên Google Drive */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Quy tắc ưu tiên Google Drive:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-indigo-800 dark:text-indigo-300/90">
              Trong trường hợp người dùng cập nhật thủ công trên Google Drive và bấm nút <b>Đồng bộ (Sync)</b>, dữ liệu từ Google Drive luôn được <b>ưu tiên tuyệt đối</b> để nạp đè và làm mới toàn bộ dữ liệu trên ứng dụng.
            </p>
          </div>

          {/* Tips for public sheet export */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Mẹo kết nối Google Sheet công khai:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/90">
              Vào Google Sheet → Chọn <b>Tệp (File)</b> → <b>Chia sẻ (Share)</b> → Chọn "Bất kỳ ai có liên kết" (Anyone with the link). Ứng dụng sẽ tự động tải dữ liệu trực tiếp khi bạn thực hiện thay đổi trên Google Sheet.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleRestoreDefault}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            {t('resetDefaultSheet')}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              {t('saveConfig')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
