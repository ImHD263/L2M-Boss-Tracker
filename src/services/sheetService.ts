import { Boss, BossStatus, ServerDaemonStatus, AutoRollMode } from '../types';
import { DEFAULT_BOSSES } from '../data/defaultBosses';

export function getSpawnRateColorClass(rateStr?: string): {
  badge: string;
  darkBadge: string;
  text: string;
} {
  if (!rateStr) {
    return {
      badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      darkBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    };
  }

  const num = parseFloat(rateStr.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) {
    return {
      badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      darkBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    };
  }

  if (num >= 80) {
    // 100% -> Xanh lá (Green / Emerald)
    return {
      badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      darkBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    };
  } else if (num >= 45) {
    // 50% -> Xanh nhạt (Sky / Cyan)
    return {
      badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
      darkBadge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      text: 'text-sky-600 dark:text-sky-400',
    };
  } else if (num >= 25) {
    // 33% -> Vàng (Amber)
    return {
      badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      darkBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
    };
  } else {
    // Dưới 25% -> Đỏ (Rose)
    return {
      badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      darkBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      text: 'text-rose-600 dark:text-rose-400',
    };
  }
}

export function calculateBossStatus(nextSpawnAt: string | null): BossStatus {
  if (!nextSpawnAt) return 'unknown';
  const now = Date.now();
  const spawnTime = new Date(nextSpawnAt).getTime();
  if (isNaN(spawnTime)) return 'unknown';

  const diffMs = spawnTime - now;

  if (diffMs <= 0) {
    return 'alive';
  } else if (diffMs <= 30 * 60 * 1000) { // 30 mins or less (Sắp ra)
    return 'soon';
  } else {
    return 'cooldown';
  }
}

export function formatRemainingTime(nextSpawnAt: string | null, lang: 'vi' | 'en' = 'vi'): {
  text: string;
  isAlive: boolean;
  isSoon: boolean;
  secondsRemaining: number;
} {
  if (!nextSpawnAt) {
    return {
      text: lang === 'vi' ? 'Chưa báo giờ' : 'Unknown time',
      isAlive: false,
      isSoon: false,
      secondsRemaining: -1,
    };
  }

  const now = Date.now();
  const spawnTime = new Date(nextSpawnAt).getTime();
  const diffSec = Math.floor((spawnTime - now) / 1000);

  if (diffSec <= 0) {
    const elapsedSec = Math.abs(diffSec);

    // Trong vòng 1 phút kể từ khi đến giờ ra: Hiển thị XUẤT HIỆN / SPAWN
    if (elapsedSec < 60) {
      return {
        text: lang === 'vi' ? 'XUẤT HIỆN' : 'SPAWN',
        isAlive: true,
        isSoon: false,
        secondsRemaining: diffSec,
      };
    }

    const elapsedMins = Math.floor(elapsedSec / 60);
    const elapsedHrs = Math.floor(elapsedMins / 60);

    let agoStr = '';
    if (elapsedHrs > 0) {
      agoStr = `${elapsedHrs}h ${elapsedMins % 60}m`;
    } else if (elapsedMins > 0) {
      agoStr = `${elapsedMins}m`;
    } else {
      agoStr = `${elapsedSec}s`;
    }

    return {
      text: lang === 'vi' ? `Đã xuất hiện (${agoStr})` : `Spawned (${agoStr} ago)`,
      isAlive: true,
      isSoon: false,
      secondsRemaining: diffSec,
    };
  }

  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  const formattedTimer = hours > 0 ? `${hStr}:${mStr}:${sStr}` : `${mStr}:${sStr}`;

  return {
    text: formattedTimer,
    isAlive: false,
    isSoon: diffSec > 0 && diffSec <= 30 * 60,
    secondsRemaining: diffSec,
  };
}

export function markBossKilled(boss: Boss): Boss {
  const killedAt = new Date();
  const respawnMs = boss.respawnMinutes * 60 * 1000;
  const nextSpawn = new Date(killedAt.getTime() + respawnMs);

  const updatedBoss: Boss = {
    ...boss,
    lastKilledAt: killedAt.toISOString(),
    nextSpawnAt: nextSpawn.toISOString(),
    status: calculateBossStatus(nextSpawn.toISOString()),
  };

  return updatedBoss;
}

// Extract Sheet ID and GID from any Google Sheet URL
export function extractSheetParams(url: string): { sheetId: string; gid: string } {
  let sheetId = '1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr';
  let gid = '0'; // Default gid for any new sheet is 0 (first tab)

  if (!url) return { sheetId, gid: '663302635' };

  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    sheetId = match[1];
  }

  const gidMatch = url.match(/[?&]gid=([0-9]+)/) || url.match(/#gid=([0-9]+)/);
  if (gidMatch && gidMatch[1]) {
    gid = gidMatch[1];
  } else if (sheetId === '1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr') {
    gid = '663302635'; // Keep original sheet's tab if unchanged
  }

  return { sheetId, gid };
}

export function extractSheetId(url: string): string {
  return extractSheetParams(url).sheetId;
}

// Fetch sheet data from server proxy
export async function fetchSheetData(sheetUrl: string, forceDrive = false): Promise<{
  bosses: Boss[];
  success: boolean;
  message?: string;
  isProtected?: boolean;
}> {
  const { sheetId, gid } = extractSheetParams(sheetUrl);
  try {
    const res = await fetch(
      `/api/sheet-data?sheetId=${encodeURIComponent(sheetId)}&sheetUrl=${encodeURIComponent(sheetUrl)}&gid=${encodeURIComponent(gid)}&force=${forceDrive ? 'true' : 'false'}&t=${Date.now()}`,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    if (data && Array.isArray(data.bosses) && data.bosses.length > 0) {
      // Recalculate status for each boss
      const updatedBosses = data.bosses.map((b: Boss) => ({
        ...b,
        category: b.category || 'local',
        status: calculateBossStatus(b.nextSpawnAt),
      }));
      return {
        bosses: updatedBosses,
        success: data.success ?? true,
        message: data.message,
        isProtected: data.isProtected,
      };
    }
  } catch (err: any) {
    console.warn('Failed to fetch from /api/sheet-data, using local fallback:', err);
  }

  // Fallback to updated DEFAULT_BOSSES
  const fallbackBosses = DEFAULT_BOSSES.map((b) => ({
    ...b,
    status: calculateBossStatus(b.nextSpawnAt),
  }));

  return {
    bosses: fallbackBosses,
    success: false,
    message: 'Using pre-loaded schedule data (Sheet offline or restricted)',
    isProtected: true,
  };
}

export function parseCooldownToMinutes(raw: string | undefined | null): number {
  if (!raw) return 60;
  const str = String(raw).toLowerCase().trim();
  if (!str || str === '-' || str === '--:--' || str === 'null') return 60;

  // Format HH:mm:ss or HH:mm (e.g. "04:30:00", "4:30:00", "03:00:00", "3:00:00", "2:30:00", "02:30", "0:00:00")
  const timeColonMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeColonMatch) {
    const hours = parseInt(timeColonMatch[1], 10);
    const mins = parseInt(timeColonMatch[2], 10);
    const secs = timeColonMatch[3] ? parseInt(timeColonMatch[3], 10) : 0;
    return hours * 60 + mins + Math.round(secs / 60);
  }

  // Format e.g. "4h30", "4h30m", "4h30p", "4 giờ 30 phút", "4 gio 30 phut"
  const comboMatch = str.match(/^([\d.]+)\s*(h|g|giờ|gio|hour|hours)\s*([\d.]+)?\s*(m|p|phút|phut|min|mins)?$/);
  if (comboMatch) {
    const h = parseFloat(comboMatch[1]) || 0;
    const m = parseFloat(comboMatch[3]) || 0;
    return Math.round(h * 60 + m);
  }

  // Format e.g. "4h", "4 giờ", "2.5h"
  const hoursMatch = str.match(/^([\d.]+)\s*(h|g|giờ|gio|hour|hours)$/);
  if (hoursMatch) {
    const h = parseFloat(hoursMatch[1]);
    if (!isNaN(h)) return Math.round(h * 60);
  }

  // Format e.g. "30m", "45 phút", "15p"
  const minsMatch = str.match(/^([\d.]+)\s*(m|p|phút|phut|min|mins)$/);
  if (minsMatch) {
    const m = parseFloat(minsMatch[1]);
    if (!isNaN(m)) return Math.round(m);
  }

  // Raw numeric minutes e.g. "60", "120"
  const numMatch = str.match(/^([\d.]+)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (!isNaN(val)) return Math.round(val);
  }

  return 60;
}

export function parseSheetDateTime(
  rawStr: string | undefined | null,
  options?: { isKillTime?: boolean; nowMs?: number }
): string | null {
  if (!rawStr || typeof rawStr !== 'string') return null;
  let s = rawStr.trim().replace(/^"(.*)"$/, '$1');
  if (!s || s === '--:--' || s === '-' || s.toLowerCase() === 'null') return null;

  // Clean Google Sheets 1899 epoch date prefix (e.g., "12/30/1899 13:23:50" -> "13:23:50")
  s = s.replace(/^(?:12\/30\/1899|30\/12\/1899|1899-12-30)\s*/i, '');

  // Direct ISO / standard date string with explicit timezone (ends with Z or offset like +07:00)
  if ((s.endsWith('Z') || s.match(/[+-]\d{2}:?\d{2}$/)) && !isNaN(new Date(s).getTime())) {
    return new Date(s).toISOString();
  }

  const nowMs = options?.nowMs || Date.now();
  // Current Vietnam / ICT (UTC+7) calendar date
  const ictDate = new Date(nowMs + (7 * 60 * 60 * 1000));
  const curYear = ictDate.getUTCFullYear();
  const curMonth = ictDate.getUTCMonth();
  const curDay = ictDate.getUTCDate();

  // 1. Time only format: "13:23:50", "03:09:00", "3:09:00", "0:00:00", "00:00:00", "13:23", "13h23", "01:23:50 PM", "1:23 PM"
  const timeOnly = s.match(/^(\d{1,2})[:h](\d{2})(?:[:m](\d{2}))?\s*(am|pm)?$/i);
  if (timeOnly) {
    let hours = parseInt(timeOnly[1], 10);
    const mins = parseInt(timeOnly[2], 10);
    const secs = timeOnly[3] ? parseInt(timeOnly[3], 10) : 0;
    const ampm = timeOnly[4] ? timeOnly[4].toLowerCase() : null;

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    // Convert ICT (UTC+7) time to UTC timestamp for TODAY in Vietnam
    let utcMs = Date.UTC(curYear, curMonth, curDay, hours - 7, mins, secs);

    // If this is a kill time, it cannot be in the future!
    // If today's time is in the future (> nowMs + 60s), this kill happened yesterday!
    if (options?.isKillTime && utcMs > nowMs + 60 * 1000) {
      utcMs -= 24 * 60 * 60 * 1000;
    }

    return new Date(utcMs).toISOString();
  }

  // 2. DD/MM/YYYY HH:mm:ss or DD/MM/YYYY HH:mm
  const dmyMatch = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2})[:h](\d{2})(?:[:m](\d{2}))?\s*(am|pm)?)?$/i);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    let hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const mins = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const secs = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    const ampm = dmyMatch[7] ? dmyMatch[7].toLowerCase() : null;

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    const utcMs = Date.UTC(year, month, day, hours - 7, mins, secs);
    return new Date(utcMs).toISOString();
  }

  // 3. YYYY-MM-DD HH:mm:ss or YYYY/MM/DD HH:mm
  const ymdMatch = s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:\s+(\d{1,2})[:h](\d{2})(?:[:m](\d{2}))?\s*(am|pm)?)?$/i);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    let hours = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
    const mins = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
    const secs = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;
    const ampm = ymdMatch[7] ? ymdMatch[7].toLowerCase() : null;

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    const utcMs = Date.UTC(year, month, day, hours - 7, mins, secs);
    return new Date(utcMs).toISOString();
  }

  const directDate = new Date(s);
  if (!isNaN(directDate.getTime())) {
    return directDate.toISOString();
  }

  return null;
}

// Parse CSV or TSV text into Boss array (Supports copy-pasted Google Sheet cells!)
export function parseCSVToBosses(csvText: string, category: 'local' | 'invasion' = 'local'): Boss[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const isTabSeparated = lines[0].includes('\t');

  const parseCSVLine = (line: string): string[] => {
    if (isTabSeparated) {
      return line.split('\t').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
    }
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const bosses: Boss[] = [];

  // 1. Name indices
  const nameIdx = headers.findIndex(h => h === 'tên boss' || h.includes('tên boss') || h.includes('tên') || h.includes('quái') || h === 'boss');
  const nameEnIdx = headers.findIndex((h, idx) => idx !== nameIdx && (h.includes('boss name') || h.includes('english') || h.includes('en') || h === 'name'));

  // 2. Map / Location indices
  const mapIdx = headers.findIndex(h => h.includes('địa điểm') || h.includes('dia diem') || h.includes('bản đồ') || h.includes('khu vực') || h.includes('map') || h.includes('vị trí'));
  const mapEnIdx = headers.findIndex((h, idx) => idx !== mapIdx && (h.includes('location') || h.includes('map en') || h.includes('bản đồ en')));

  // 3. Cooldown / Respawn time (e.g. "Thời gian xuất hiện lại (spawn)", "Cooldown", "Thời gian hồi", "Respawn")
  const cdIdx = headers.findIndex(h => 
    h.includes('xuất hiện lại') || 
    h.includes('xuat hien lai') || 
    h.includes('lại') || 
    h.includes('lai') || 
    h.includes('cooldown') || 
    h.includes('hồi') || 
    h.includes('respawn') || 
    h.includes('cd') || 
    (h.includes('spawn') && !h.includes('next'))
  );

  // 4. Last killed time (e.g. "Thời Gian chết", "Lần cuối diệt", "Chết lúc", "Last Kill")
  const lastKillIdx = headers.findIndex(h => 
    h.includes('chết') || 
    h.includes('chet') || 
    h.includes('diệt') || 
    h.includes('diet') || 
    h.includes('lần cuối') || 
    h.includes('lan cuoi') || 
    h.includes('last kill')
  );

  // 5. Next spawn time (e.g. "Xuất Hiện", "Dự kiến", "Ra kế", "Next Spawn", "Tiếp theo")
  const nextSpawnIdx = headers.findIndex((h, idx) => 
    idx !== cdIdx && idx !== lastKillIdx && (
      h.includes('dự kiến') || 
      h.includes('du kien') || 
      h.includes('tiếp theo') || 
      h.includes('tiep theo') || 
      h.includes('ra kế') || 
      h.includes('ra ke') || 
      h.includes('next spawn') || 
      h.includes('xuất hiện') || 
      h.includes('xuat hien')
    )
  );

  // 6. Level, Clan, Rate, Is Big Boss
  const clanIdx = headers.findIndex(h => h.includes('clan') || h.includes('bang') || h.includes('guild') || h.includes('kênh') || h.includes('channel'));
  const levelIdx = headers.findIndex(h => h.includes('level') || h.includes('cấp') || h.includes('lv'));
  const rateIdx = headers.findIndex(h => h.includes('%') || h.includes('tỷ lệ') || h.includes('tỉ lệ') || h.includes('rate') || h.includes('chance'));
  const bigBossIdx = headers.findIndex(h => h.includes('big boss') || h.includes('bigboss') || h === 'big' || h.includes('boss lớn') || h.includes('boss lon'));

  // 7. Update Auto & Time Update Auto indices
  const updateAutoIdx = headers.findIndex(h => 
    h.includes('update auto') || 
    h.includes('auto update') || 
    h.includes('tự động') || 
    h.includes('tu dong') ||
    h === 'auto'
  );
  const timeUpdateAutoIdx = headers.findIndex(h => 
    h.includes('time update auto') || 
    h.includes('thời gian update') || 
    h.includes('thoi gian update') || 
    h.includes('giờ update') || 
    h.includes('gio update') || 
    h.includes('time auto') ||
    h.includes('thời gian tự động')
  );

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 1 || cols.every(c => c === '')) continue;

    let rawName = cols[nameIdx >= 0 ? nameIdx : 0]?.trim();
    if (nameIdx < 0 && /^\d+$/.test(rawName) && cols.length > 1) {
      rawName = cols[1]?.trim();
    }

    if (!rawName || rawName === '' || /^tên\s*boss$/i.test(rawName) || /^stt$/i.test(rawName) || /^tên$/i.test(rawName) || /^name$/i.test(rawName) || /^tổng/i.test(rawName) || /^ghi\s*chú/i.test(rawName)) {
      continue; // Skip header or invalid/empty rows
    }

    const name = rawName;
    const nameEn = (nameEnIdx >= 0 && cols[nameEnIdx]?.trim()) ? cols[nameEnIdx].trim() : undefined;
    const map = (mapIdx >= 0 && cols[mapIdx]?.trim()) ? cols[mapIdx].trim() : (cols[1] || 'Khu Vực Trung Tâm');
    const mapEn = (mapEnIdx >= 0 && cols[mapEnIdx]?.trim()) ? cols[mapEnIdx].trim() : undefined;
    const channel = (clanIdx >= 0 && cols[clanIdx]?.trim()) ? cols[clanIdx].trim() : 'Kênh 1';

    // Cooldown / respawn interval in minutes
    const rawCdStr = cdIdx >= 0 ? cols[cdIdx] : (cols[8] || cols[11] || '60');
    let cdMins = parseCooldownToMinutes(rawCdStr);

    let level = parseInt(cols[levelIdx >= 0 ? levelIdx : 4] || '100', 10);
    if (isNaN(level)) level = 90;

    const rawLastKill = lastKillIdx >= 0 ? cols[lastKillIdx] : cols[6];
    const rawNextSpawn = nextSpawnIdx >= 0 ? cols[nextSpawnIdx] : cols[7];

    const nowMs = Date.now();
    let lastKilledAt = parseSheetDateTime(rawLastKill, { isKillTime: true, nowMs });
    let nextSpawnAt = parseSheetDateTime(rawNextSpawn, { nowMs });

    // If both raw lastKill and nextSpawn are "00:00:00" or "0:00:00" and cdMins === 0 (like Tinh Linh)
    const isZeroTimer = (!rawLastKill || /^0{1,2}:00(?::00)?$/.test(rawLastKill.trim())) &&
                        (!rawNextSpawn || /^0{1,2}:00(?::00)?$/.test(rawNextSpawn.trim())) &&
                        cdMins === 0;

    if (isZeroTimer) {
      lastKilledAt = null;
      nextSpawnAt = null;
    } else {
      if (lastKilledAt && cdMins > 0) {
        // Mathematical precision: next spawn time is exactly last kill + cooldown
        const killMs = new Date(lastKilledAt).getTime();
        const baseSpawnMs = killMs + cdMins * 60 * 1000;
        nextSpawnAt = new Date(baseSpawnMs).toISOString();
      } else if (!nextSpawnAt && lastKilledAt && cdMins > 0) {
        nextSpawnAt = new Date(new Date(lastKilledAt).getTime() + cdMins * 60 * 1000).toISOString();
      }
    }

    // Spawn rate
    const rawRate = rateIdx >= 0 ? cols[rateIdx] : cols[5];
    const spawnRate = rawRate && rawRate.trim() ? (rawRate.includes('%') ? rawRate.trim() : `${rawRate.trim()}%`) : '100%';

    // Parse Is Big Boss from column K (or header matching "is big boss")
    let isBigBoss = false;
    const rawBigBoss = (bigBossIdx >= 0 ? cols[bigBossIdx] : cols[10])?.trim().toLowerCase();
    if (rawBigBoss === 'yes' || rawBigBoss === 'y' || rawBigBoss === 'có' || rawBigBoss === 'co' || rawBigBoss === '1' || rawBigBoss === 'true' || rawBigBoss === 'x') {
      isBigBoss = true;
    }

    // Parse Update Auto & Time Update Auto values from sheet
    let updateAuto: 'Yes' | 'No' = 'No';
    if (updateAutoIdx >= 0 && cols[updateAutoIdx]) {
      const uVal = cols[updateAutoIdx].trim().toLowerCase();
      if (uVal === 'yes' || uVal === 'y' || uVal === 'có' || uVal === 'co' || uVal === '1' || uVal === 'true') {
        updateAuto = 'Yes';
      } else if (uVal === 'no' || uVal === 'n' || uVal === 'không' || uVal === 'khong' || uVal === '0' || uVal === 'false') {
        updateAuto = 'No';
      }
    }

    const rawTimeAuto = timeUpdateAutoIdx >= 0 ? cols[timeUpdateAutoIdx]?.trim() : null;
    const timeUpdateAuto = rawTimeAuto && rawTimeAuto !== '-' && rawTimeAuto !== '--:--' ? rawTimeAuto : null;

    const boss: Boss = {
      id: `${category}-sheet-boss-${i}`,
      name,
      nameEn,
      map,
      mapEn,
      channel,
      level,
      respawnMinutes: cdMins,
      lastKilledAt,
      nextSpawnAt,
      status: calculateBossStatus(nextSpawnAt),
      drops: [],
      spawnRate,
      isBigBoss,
      updateAuto,
      timeUpdateAuto,
      category,
    };

    bosses.push(boss);
  }

  return bosses;
}

// Check if a Boss has 100% spawn rate
export function is100PercentBoss(boss: Boss): boolean {
  if (!boss.spawnRate) return false;
  const cleaned = boss.spawnRate.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return num === 100;
}

// Format date time in Vietnamese / ICT standard string (HH:mm:ss DD/MM/YYYY)
export function formatDateTimeVN(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${h}:${min}:${s} ${d}/${m}/${y}`;
}

// For 100% spawn rate Bosses: when spawn time arrives, roll spawn time into death time and calculate next spawn
export function checkAndAutoRoll100PercentBoss(
  boss: Boss,
  nowMs: number
): { rolled: boolean; updatedBoss: Boss } {
  if (!is100PercentBoss(boss)) {
    return { rolled: false, updatedBoss: boss };
  }

  return recalculateBossSpawnTime(boss, nowMs);
}

/**
 * Tự động tính lại giờ Boss xuất hiện khi giờ dự tính nhỏ hơn giờ hiện tại (nextSpawnAt < nowMs)
 * - Không quan tâm tỷ lệ xuất hiện là bao nhiêu % (áp dụng cho tất cả boss)
 * - Bỏ qua giờ boss chết, lấy giờ boss dự tính xuất hiện làm mốc
 * - Tính lại giờ boss xuất hiện trong tương lai theo chu kỳ hồi sinh (cooldown) giống logic 100%
 */
export function recalculateBossSpawnTime(
  boss: Boss,
  nowMs: number = Date.now()
): { rolled: boolean; recalculated: boolean; updatedBoss: Boss } {
  if (boss.respawnMinutes <= 0) {
    return { rolled: false, recalculated: false, updatedBoss: boss };
  }

  // Lấy giờ dự tính xuất hiện (nếu không có thì suy ra từ lastKilledAt + respawnMinutes)
  let baseSpawnMs: number | null = null;
  if (boss.nextSpawnAt) {
    baseSpawnMs = new Date(boss.nextSpawnAt).getTime();
  } else if (boss.lastKilledAt) {
    baseSpawnMs = new Date(boss.lastKilledAt).getTime() + boss.respawnMinutes * 60 * 1000;
  }

  if (!baseSpawnMs || isNaN(baseSpawnMs)) {
    return { rolled: false, recalculated: false, updatedBoss: boss };
  }

  // Nếu giờ boss xuất hiện nhỏ hơn hoặc bằng giờ hiện tại (đã quá giờ xuất hiện)
  // Đợi ít nhất 1 phút (60 giây) sau khi ra để giữ trạng thái SPAWN (XUẤT HIỆN) cho người xem theo dõi
  if (nowMs >= baseSpawnMs + 60 * 1000) {
    const cdMs = boss.respawnMinutes * 60 * 1000;
    let cycleSpawnMs = baseSpawnMs;
    let lastCycleMs = baseSpawnMs;

    // Cộng dồn chu kỳ hồi sinh cho đến khi lớn hơn giờ hiện tại
    while (cycleSpawnMs <= nowMs && cdMs > 0) {
      lastCycleMs = cycleSpawnMs;
      cycleSpawnMs += cdMs;
    }

    const newNextSpawnAt = new Date(cycleSpawnMs).toISOString();
    // Bỏ qua giờ boss chết cũ, lấy mốc giờ dự tính vừa qua làm giờ chết/xuất hiện gần nhất
    const newLastKilledAt = new Date(lastCycleMs).toISOString();
    const timeUpdateAuto = formatDateTimeVN(new Date(nowMs));

    const updatedBoss: Boss = {
      ...boss,
      lastKilledAt: newLastKilledAt,
      nextSpawnAt: newNextSpawnAt,
      updateAuto: 'Yes',
      timeUpdateAuto,
      status: calculateBossStatus(newNextSpawnAt),
    };

    return { rolled: true, recalculated: true, updatedBoss };
  }

  return { rolled: false, recalculated: false, updatedBoss: boss };
}

/**
 * Tính lại hàng loạt cho tất cả Boss có giờ xuất hiện < giờ hiện tại
 */
export function recalculateAllExpiredBosses(
  bosses: Boss[],
  nowMs: number = Date.now()
): {
  updatedBosses: Boss[];
  recalculatedCount: number;
  changedBosses: Boss[];
} {
  let count = 0;
  const changedBosses: Boss[] = [];

  const updatedBosses = bosses.map((b) => {
    const { recalculated, updatedBoss } = recalculateBossSpawnTime(b, nowMs);
    if (recalculated) {
      count++;
      changedBosses.push(updatedBoss);
      return updatedBoss;
    }
    return b;
  });

  return {
    updatedBosses,
    recalculatedCount: count,
    changedBosses,
  };
}

// Call server API to update boss data back to Google Drive / Google Sheet
export async function updateBossToDriveApi(
  boss: Boss,
  sheetConfig: { sheetUrl: string; sheetId: string; webhookUrl?: string }
): Promise<{ success: boolean; driveSyncSuccess: boolean; message: string }> {
  try {
    const res = await fetch('/api/sheet-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheetUrl: sheetConfig.sheetUrl,
        sheetId: sheetConfig.sheetId,
        webhookUrl: sheetConfig.webhookUrl,
        boss,
      }),
    });

    if (!res.ok) {
      return {
        success: false,
        driveSyncSuccess: false,
        message: `HTTP error ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      success: data.success ?? true,
      driveSyncSuccess: data.driveSyncSuccess ?? false,
      message: data.message || 'Cập nhật thành công',
    };
  } catch (err: any) {
    console.warn('Failed to call /api/sheet-update:', err);
    return {
      success: false,
      driveSyncSuccess: false,
      message: err.message || 'Network error',
    };
  }
}

// Gửi cấu hình chạy ngầm 24/7 đến máy chủ Node.js backend
export async function syncServerDaemonConfig(config: {
  sheetUrl?: string;
  sheetId?: string;
  webhookUrl?: string;
  autoRollMode?: AutoRollMode;
  enabled?: boolean;
}): Promise<{ success: boolean; status?: ServerDaemonStatus; message?: string }> {
  try {
    const res = await fetch('/api/server-daemon/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      return { success: false, message: `HTTP error ${res.status}` };
    }
    const data = await res.json();
    return {
      success: data.success ?? true,
      status: data.status,
      message: data.message,
    };
  } catch (err: any) {
    console.warn('Failed to sync server daemon config:', err);
    return { success: false, message: err.message || 'Network error' };
  }
}

// Lấy trạng thái hoạt động của Server Daemon chạy ngầm 24/7
export async function fetchServerDaemonStatus(): Promise<ServerDaemonStatus | null> {
  try {
    const res = await fetch('/api/server-daemon/status');
    if (!res.ok) return null;
    const data = await res.json();
    return data.status || data;
  } catch (e) {
    console.warn('Failed to fetch server daemon status:', e);
    return null;
  }
}

