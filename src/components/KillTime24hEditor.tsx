import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { formatTime24h, formatDateTime24h } from '../utils/timeFormat';
import { Clock, Calendar, Zap, RotateCcw, Check, Sparkles } from 'lucide-react';

interface KillTime24hEditorProps {
  initialIsoString: string | null;
  cooldownMinutes: number;
  language: Language;
  onChange: (isoString: string | null) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

function getLocalPartsFromIso(iso: string | null) {
  if (!iso) {
    const now = new Date();
    return {
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      hour: pad(now.getHours()),
      minute: pad(now.getMinutes()),
      second: pad(now.getSeconds()),
      hasValue: false,
    };
  }

  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return {
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      hour: pad(now.getHours()),
      minute: pad(now.getMinutes()),
      second: pad(now.getSeconds()),
      hasValue: false,
    };
  }

  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hour: pad(d.getHours()),
    minute: pad(d.getMinutes()),
    second: pad(d.getSeconds()),
    hasValue: true,
  };
}

export const KillTime24hEditor: React.FC<KillTime24hEditorProps> = ({
  initialIsoString,
  cooldownMinutes,
  language,
  onChange,
}) => {
  const initial = getLocalPartsFromIso(initialIsoString);

  const [hasKillTime, setHasKillTime] = useState<boolean>(initial.hasValue);
  const [dateStr, setDateStr] = useState<string>(initial.date);
  const [hourStr, setHourStr] = useState<string>(initial.hour);
  const [minuteStr, setMinuteStr] = useState<string>(initial.minute);
  const [secondStr, setSecondStr] = useState<string>(initial.second);
  const [timeText, setTimeText] = useState<string>(`${initial.hour}:${initial.minute}:${initial.second}`);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Synchronize internal state when initialIsoString changes from outside
  useEffect(() => {
    const parts = getLocalPartsFromIso(initialIsoString);
    setHasKillTime(parts.hasValue);
    setDateStr(parts.date);
    setHourStr(parts.hour);
    setMinuteStr(parts.minute);
    setSecondStr(parts.second);
    setTimeText(`${parts.hour}:${parts.minute}:${parts.second}`);
    setTimeError(null);
  }, [initialIsoString]);

  // Build local Date object and push ISO string to parent
  const updateTimeValue = (
    newHasKillTime: boolean,
    newDate: string,
    newHour: string,
    newMinute: string,
    newSecond: string
  ) => {
    if (!newHasKillTime) {
      onChange(null);
      return;
    }

    const [year, month, day] = newDate.split('-').map(Number);
    const h = parseInt(newHour, 10);
    const m = parseInt(newMinute, 10);
    const s = parseInt(newSecond, 10);

    if (
      isNaN(year) || isNaN(month) || isNaN(day) ||
      isNaN(h) || h < 0 || h > 23 ||
      isNaN(m) || m < 0 || m > 59 ||
      isNaN(s) || s < 0 || s > 59
    ) {
      setTimeError(language === 'vi' ? 'Giờ không hợp lệ (00-23h, 00-59m, 00-59s)' : 'Invalid time (00-23h, 00-59m, 00-59s)');
      return;
    }

    setTimeError(null);
    const dateObj = new Date(year, month - 1, day, h, m, s);
    if (!isNaN(dateObj.getTime())) {
      onChange(dateObj.toISOString());
    }
  };

  // Quick Preset Actions
  const handleSetNow = () => {
    const now = new Date();
    const dStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const hStr = pad(now.getHours());
    const mStr = pad(now.getMinutes());
    const sStr = pad(now.getSeconds());

    setHasKillTime(true);
    setDateStr(dStr);
    setHourStr(hStr);
    setMinuteStr(mStr);
    setSecondStr(sStr);
    setTimeText(`${hStr}:${mStr}:${sStr}`);
    updateTimeValue(true, dStr, hStr, mStr, sStr);
  };

  const handleSetMinutesAgo = (minutesAgo: number) => {
    const target = new Date(Date.now() - minutesAgo * 60 * 1000);
    const dStr = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
    const hStr = pad(target.getHours());
    const mStr = pad(target.getMinutes());
    const sStr = pad(target.getSeconds());

    setHasKillTime(true);
    setDateStr(dStr);
    setHourStr(hStr);
    setMinuteStr(mStr);
    setSecondStr(sStr);
    setTimeText(`${hStr}:${mStr}:${sStr}`);
    updateTimeValue(true, dStr, hStr, mStr, sStr);
  };

  const handleSetToday = () => {
    const now = new Date();
    const dStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setDateStr(dStr);
    if (hasKillTime) {
      updateTimeValue(true, dStr, hourStr, minuteStr, secondStr);
    }
  };

  const handleSetYesterday = () => {
    const yest = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dStr = `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`;
    setDateStr(dStr);
    if (hasKillTime) {
      updateTimeValue(true, dStr, hourStr, minuteStr, secondStr);
    }
  };

  const handleClear = () => {
    setHasKillTime(false);
    setTimeError(null);
    onChange(null);
  };

  // Direct text input handler (e.g. typing "14:30" or "14:30:00")
  const handleTimeTextChange = (val: string) => {
    setTimeText(val);
    setHasKillTime(true);

    const parts = val.trim().split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const s = parts.length >= 3 ? parseInt(parts[2], 10) : 0;

      if (!isNaN(h) && h >= 0 && h <= 23 && !isNaN(m) && m >= 0 && m <= 59 && !isNaN(s) && s >= 0 && s <= 59) {
        const paddedH = pad(h);
        const paddedM = pad(m);
        const paddedS = pad(s);
        setHourStr(paddedH);
        setMinuteStr(paddedM);
        setSecondStr(paddedS);
        setTimeError(null);
        updateTimeValue(true, dateStr, paddedH, paddedM, paddedS);
        return;
      }
    }
    setTimeError(language === 'vi' ? 'Nhập theo định dạng 24H: HH:mm hoặc HH:mm:ss (00:00 - 23:59)' : 'Format: HH:mm or HH:mm:ss (00:00 - 23:59)');
  };

  // Individual hour, minute, second change handlers
  const handleHourChange = (newH: number) => {
    const clamped = Math.max(0, Math.min(23, isNaN(newH) ? 0 : newH));
    const h = pad(clamped);
    setHourStr(h);
    setHasKillTime(true);
    setTimeText(`${h}:${minuteStr}:${secondStr}`);
    updateTimeValue(true, dateStr, h, minuteStr, secondStr);
  };

  const handleMinuteChange = (newM: number) => {
    const clamped = Math.max(0, Math.min(59, isNaN(newM) ? 0 : newM));
    const m = pad(clamped);
    setMinuteStr(m);
    setHasKillTime(true);
    setTimeText(`${hourStr}:${m}:${secondStr}`);
    updateTimeValue(true, dateStr, hourStr, m, secondStr);
  };

  const handleSecondChange = (newS: number) => {
    const clamped = Math.max(0, Math.min(59, isNaN(newS) ? 0 : newS));
    const s = pad(clamped);
    setSecondStr(s);
    setHasKillTime(true);
    setTimeText(`${hourStr}:${minuteStr}:${s}`);
    updateTimeValue(true, dateStr, hourStr, minuteStr, s);
  };

  // Calculate live preview of spawn time
  let selectedDateObj: Date | null = null;
  let estimatedSpawnDateObj: Date | null = null;
  if (hasKillTime) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const h = parseInt(hourStr, 10);
    const m = parseInt(minuteStr, 10);
    const s = parseInt(secondStr, 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(h) && !isNaN(m)) {
      selectedDateObj = new Date(year, month - 1, day, h, m, isNaN(s) ? 0 : s);
      if (!isNaN(selectedDateObj.getTime())) {
        estimatedSpawnDateObj = new Date(selectedDateObj.getTime() + cooldownMinutes * 60 * 1000);
      }
    }
  }

  return (
    <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 transition-colors">
      
      {/* Header with explicit 24-Hour Guarantee */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>{language === 'vi' ? 'Nhập Giờ Chết Của Boss' : 'Enter Boss Kill Time'}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                24H FORMAT
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'vi' 
                ? 'Chuẩn 24 giờ (00:00 - 23:59) • Tuyệt đối không có AM / PM'
                : '24-hour clock (00:00 - 23:59) • No AM / PM selection'}
            </div>
          </div>
        </div>

        {/* Status / Clear action */}
        {hasKillTime ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{language === 'vi' ? 'Xóa giờ chết' : 'Clear Time'}</span>
          </button>
        ) : (
          <span className="text-[11px] italic text-slate-400">
            {language === 'vi' ? '(Chưa có giờ chết)' : '(No kill time set)'}
          </span>
        )}
      </div>

      {/* Quick Preset Buttons */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>{language === 'vi' ? 'Chọn nhanh mốc thời gian:' : 'Quick Presets:'}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={handleSetNow}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>{language === 'vi' ? '⚡ Vừa chết (Bây giờ)' : '⚡ Just Killed (Now)'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetMinutesAgo(5)}
            className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            -5 {language === 'vi' ? 'phút' : 'mins'}
          </button>
          <button
            type="button"
            onClick={() => handleSetMinutesAgo(15)}
            className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            -15 {language === 'vi' ? 'phút' : 'mins'}
          </button>
          <button
            type="button"
            onClick={() => handleSetMinutesAgo(30)}
            className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            -30 {language === 'vi' ? 'phút' : 'mins'}
          </button>
          <button
            type="button"
            onClick={() => handleSetMinutesAgo(60)}
            className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            -1 {language === 'vi' ? 'tiếng' : 'hour'}
          </button>
        </div>
      </div>

      {/* Date & 24-Hour Time Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        
        {/* 1. Date Picker (Standard HTML5 date: only year-month-day, absolutely no AM/PM) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'vi' ? 'Ngày chết (YYYY-MM-DD)' : 'Kill Date'}</span>
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleSetToday}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 font-semibold cursor-pointer"
              >
                {language === 'vi' ? 'Hôm nay' : 'Today'}
              </button>
              <button
                type="button"
                onClick={handleSetYesterday}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 font-semibold cursor-pointer"
              >
                {language === 'vi' ? 'Hôm qua' : 'Yesterday'}
              </button>
            </div>
          </div>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => {
              setDateStr(e.target.value);
              setHasKillTime(true);
              updateTimeValue(true, e.target.value, hourStr, minuteStr, secondStr);
            }}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>

        {/* 2. Pure 24-Hour Time Picker (Hours 00-23, Minutes 00-59, Seconds 00-59) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {language === 'vi' ? 'Giờ chết 24h (Giờ : Phút : Giây)' : '24-Hour Kill Time (HH:MM:SS)'}
          </label>
          
          <div className="flex items-center space-x-1.5">
            {/* Hour: 00 - 23 */}
            <div className="flex-1 text-center">
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={parseInt(hourStr, 10) || 0}
                  onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
                  className="w-full px-1.5 py-2 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">00 - 23h</span>
            </div>

            <span className="font-bold text-slate-400 text-base pb-3.5">:</span>

            {/* Minute: 00 - 59 */}
            <div className="flex-1 text-center">
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={parseInt(minuteStr, 10) || 0}
                  onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
                  className="w-full px-1.5 py-2 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">00 - 59m</span>
            </div>

            <span className="font-bold text-slate-400 text-base pb-3.5">:</span>

            {/* Second: 00 - 59 */}
            <div className="flex-1 text-center">
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={parseInt(secondStr, 10) || 0}
                  onChange={(e) => handleSecondChange(parseInt(e.target.value, 10))}
                  className="w-full px-1.5 py-2 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">00 - 59s</span>
            </div>
          </div>
        </div>

      </div>

      {/* Alternative direct typing input for 24h */}
      <div className="pt-1">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-slate-500 dark:text-slate-400">
            {language === 'vi' ? 'Hoặc gõ trực tiếp giờ 24h vào ô này:' : 'Or type 24-hour time directly:'}
          </span>
          <span className="font-mono text-[10px] text-slate-400">VD: 14:35:00 hoặc 23:10</span>
        </div>
        <input
          type="text"
          value={timeText}
          onChange={(e) => handleTimeTextChange(e.target.value)}
          placeholder="HH:mm:ss (VD: 14:30:00)"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
        {timeError && (
          <p className="text-[11px] text-rose-500 font-medium mt-1">⚠️ {timeError}</p>
        )}
      </div>

      {/* Live Preview of 24h Calculation */}
      <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-indigo-500" />
            <span>{language === 'vi' ? 'Giờ chết đã chọn (24H):' : 'Selected Kill Time (24H):'}</span>
          </span>
          <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 text-sm">
            {selectedDateObj ? formatTime24h(selectedDateObj) : '--:--:--'}
          </span>
        </div>

        {selectedDateObj && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono text-right">
            Ngày: {selectedDateObj.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        )}

        <div className="pt-1.5 border-t border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-800 dark:text-emerald-400">
            {language === 'vi' ? '➡️ Giờ ra kế tiếp (dự tính):' : '➡️ Next Spawn Time:'}
          </span>
          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
            {estimatedSpawnDateObj ? formatDateTime24h(estimatedSpawnDateObj) : '--:--:--'}
          </span>
        </div>
      </div>

    </div>
  );
};
