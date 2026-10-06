import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Default initial bosses dataset
const DEFAULT_BOSSES_DATA = [
  {
    id: 'boss-sheet-1',
    name: 'Tinh Linh',
    nameEn: 'Olkuth',
    map: 'Điện Thần Tinh Linh',
    mapEn: 'หุบเขาเงียบสงัด',
    channel: 'Kênh 1',
    level: 70,
    hp: '10,000,000 HP',
    respawnMinutes: 0,
    lastKilledAt: null,
    nextSpawnAt: null,
    status: 'unknown',
    drops: [],
    notes: 'Boss Tinh Linh Olkuth - Vùng đất Tinh Linh',
    element: 'earth',
    spawnRate: '33%',
    isBigBoss: true,
    image: 'https://images.unsplash.com/photo-1511497584788-876761c11969?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'boss-sheet-2',
    name: 'Pan Narod',
    nameEn: 'Pan Narod',
    map: 'Vườn Gorgon',
    mapEn: 'สวนกอร์กอน',
    channel: 'Kênh 1',
    level: 75,
    hp: '14,000,000 HP',
    respawnMinutes: 180, // 3:00:00
    lastKilledAt: null,
    nextSpawnAt: null,
    status: 'cooldown',
    drops: [],
    notes: 'Boss Vườn Gorgon - Chu kỳ hồi 3 giờ',
    element: 'wind',
    spawnRate: '50%',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'boss-sheet-3',
    name: 'Tromba',
    nameEn: 'Tromba',
    map: 'Đầm lấy máu',
    mapEn: 'บึงเลือด',
    channel: 'Kênh 1',
    level: 80,
    hp: '18,500,000 HP',
    respawnMinutes: 270, // 4:30:00
    lastKilledAt: null,
    nextSpawnAt: null,
    status: 'cooldown',
    drops: [],
    notes: 'Boss Đầm Lấy Máu - Chu kỳ hồi 4h30p',
    element: 'dark',
    spawnRate: '50%',
    image: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'boss-sheet-4',
    name: 'Felis',
    nameEn: 'Felis',
    map: 'Tổ Ong',
    mapEn: 'บีไฮฟ์',
    channel: 'Kênh 1',
    level: 85,
    hp: '22,000,000 HP',
    respawnMinutes: 120, // 2:00:00
    lastKilledAt: null,
    nextSpawnAt: null,
    status: 'cooldown',
    drops: [],
    notes: 'Boss Tổ Ong - Chu kỳ hồi 2 giờ',
    element: 'light',
    spawnRate: '50%',
    image: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'boss-sheet-5',
    name: 'Basila',
    nameEn: 'Basila',
    map: 'Phía nam hoang mạc',
    mapEn: 'ทุ่งรกร้างตอนใต้',
    channel: 'Kênh 1',
    level: 90,
    hp: '25,000,000 HP',
    respawnMinutes: 150, // 2:30:00
    lastKilledAt: null,
    nextSpawnAt: null,
    status: 'cooldown',
    drops: [],
    notes: 'Boss Phía Nam Hoang Mạc - Chu kỳ hồi 2h30p',
    element: 'fire',
    spawnRate: '50%',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'boss-1',
    name: 'Hỏa Thần Ignis',
    nameEn: 'Fire Demon Ignis',
    map: 'Thung Lũng Núi Lửa (Volcano Valley)',
    mapEn: 'Volcano Valley',
    channel: 'Kênh 1',
    level: 95,
    hp: '12,500,000 HP',
    respawnMinutes: 120,
    lastKilledAt: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
    nextSpawnAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    status: 'soon',
    drops: ['Kiếm Hỏa Thần', 'Đá Cường Hóa Vô Cực', 'Áo Giáp Ma Long', 'Nhẫn Rồng Đỏ'],
    notes: 'Miễn nhiễm sát thương lửa. Cần kĩ năng Khống Chế.',
    element: 'fire',
    spawnRate: '100%',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'boss-2',
    name: 'Băng Giới Nữ Hoàng Leviathan',
    nameEn: 'Frost Queen Leviathan',
    map: 'Đỉnh Núi Tuyết Vĩnh Cửu',
    mapEn: 'Eternal Ice Peak',
    channel: 'Kênh 1',
    level: 110,
    hp: '28,000,000 HP',
    respawnMinutes: 240,
    lastKilledAt: new Date(Date.now() - 245 * 60 * 1000).toISOString(),
    nextSpawnAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'alive',
    drops: ['Trượng Băng Tuyết', 'Mặt Nạ Tuyết Nữ', 'Lông Vũ Băng Long', 'Sách Phép Tuyết Sơn'],
    notes: 'Boss đang xuất hiện Kênh 1!',
    element: 'water',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'boss-3',
    name: 'Hắc Ma Vương Shadowguard',
    nameEn: 'Shadow Overlord Guard',
    map: 'Lâu Đài Bóng Đêm',
    mapEn: 'Dark Citadel Floor 3',
    channel: 'Kênh 2',
    level: 125,
    hp: '45,000,000 HP',
    respawnMinutes: 180,
    lastKilledAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    nextSpawnAt: new Date(Date.now() + 140 * 60 * 1000).toISOString(),
    status: 'cooldown',
    drops: ['Mảnh Thạch Hắc Ma', 'Song Đao Bóng Đêm', 'Mũ Giáp Vô Diện'],
    notes: 'Rớt nguyên liệu SSS. Cần tổ đội trên 10 người.',
    element: 'dark',
    image: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'boss-4',
    name: 'Thần Thú Cổ Thụ Behemoth',
    nameEn: 'Ancient Treant Behemoth',
    map: 'Khu Rừng Cổ Triệu Năm',
    mapEn: 'Ancient Redwood Forest',
    channel: 'Kênh 3',
    level: 80,
    hp: '8,000,000 HP',
    respawnMinutes: 60,
    lastKilledAt: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    nextSpawnAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
    status: 'soon',
    drops: ['Cung Cổ Thụ', 'Hạt Giống Cung Đình', 'Bùa Hồi Sinh'],
    notes: 'Phản sát thương vật lý 20%.',
    element: 'earth',
    image: 'https://images.unsplash.com/photo-1511497584788-876761c11969?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'boss-5',
    name: 'Lôi Thần Thor Guardian',
    nameEn: 'Thunder God Guardian',
    map: 'Tháp Sấm Truyền Tier 5',
    mapEn: 'Thunder Tower Tier 5',
    channel: 'Kênh 1',
    level: 130,
    hp: '60,000,000 HP',
    respawnMinutes: 360,
    lastKilledAt: new Date(Date.now() - 370 * 60 * 1000).toISOString(),
    nextSpawnAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'alive',
    drops: ['Búa Sấm Điện', 'Giáp Lực Điện Lôi', 'Nhẫn Sét Hoàng Gia'],
    notes: 'Đang ALIVE Kênh 1!',
    element: 'light',
    image: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'boss-6',
    name: 'Phong Thần Zephyr',
    nameEn: 'Wind Lord Zephyr',
    map: 'Thảo Nguyên Gió Hú',
    mapEn: 'Howling Wind Plains',
    channel: 'Kênh 2',
    level: 88,
    hp: '10,200,000 HP',
    respawnMinutes: 90,
    lastKilledAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    nextSpawnAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    status: 'cooldown',
    drops: ['Giày Tốc Phong', 'Cung Cuồng Phong', 'Ngọc Gió Thần'],
    notes: 'Di chuyển cực nhanh.',
    element: 'wind',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'boss-7',
    name: 'Hỏa Ma Trăn Pyro Hydra',
    nameEn: 'Pyro Flame Hydra',
    map: 'Hang Động Dung Nham',
    mapEn: 'Lava Abyss Cave',
    channel: 'Kênh 4',
    level: 105,
    hp: '22,000,000 HP',
    respawnMinutes: 150,
    lastKilledAt: new Date(Date.now() - 148 * 60 * 1000).toISOString(),
    nextSpawnAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    status: 'soon',
    drops: ['Răng Trăn Dung Nham', 'Vảy Rồng Lửa', 'Đá Hỏa Tinh'],
    notes: 'Có 3 đầu, phân thân 50% HP.',
    element: 'fire',
    image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'boss-8',
    name: 'Tà Thần Cổ Đại Cthulhu Lord',
    nameEn: 'Ancient Abyss Cthulhu',
    map: 'Vực Thẳm Biển Sâu',
    mapEn: 'Abyssal Ocean Trench',
    channel: 'VVIP Server',
    level: 150,
    hp: '100,000,000 HP',
    respawnMinutes: 720,
    lastKilledAt: null,
    nextSpawnAt: null,
    status: 'unknown',
    drops: ['Vương Miện Thủy Tinh', 'Song Đao Biển Sâu', 'Trứng Rồng Thủy Tề'],
    notes: 'Super World Boss! Bấm Đã Diệt Boss khi cập nhật.',
    element: 'water',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
  }
];

// Active server-side bosses cache with updateAuto fields
let serverLocalBossesCache: any[] = DEFAULT_BOSSES_DATA.map(b => ({
  ...b,
  category: 'local',
  updateAuto: 'No',
  timeUpdateAuto: null,
}));

let serverInvasionBossesCache: any[] = [];
let serverBossesCache: any[] = [...serverLocalBossesCache];

interface ServerDaemonConfig {
  sheetId: string;
  gid: string;
  sheetUrl: string;
  webhookUrl: string;
  autoRollMode: 'all' | '100_only' | 'disabled';
  enabled: boolean;
  intervalSeconds: number;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), 'server-daemon-config.json');

let serverDaemonConfig: ServerDaemonConfig = {
  sheetId: '1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr',
  gid: '663302635',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr/edit?gid=663302635#gid=663302635',
  webhookUrl: '',
  autoRollMode: 'all', // 'all': Tự động cuộn chu kỳ mới cho tất cả Boss khi < Giờ hiện tại (Bỏ qua giờ chết, lấy giờ xuất hiện làm mốc)
  enabled: true,
  intervalSeconds: 10,
};

// Try loading persisted config from disk
try {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    serverDaemonConfig = { ...serverDaemonConfig, ...parsed };
    console.log('[Server Daemon 24/7] Loaded persisted config:', serverDaemonConfig);
  }
} catch (e) {
  console.warn('[Server Daemon 24/7] Error reading config file:', e);
}

function saveServerDaemonConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(serverDaemonConfig, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Server Daemon 24/7] Error saving config file:', e);
  }
}

let lastDaemonRunAt: string | null = null;
let totalAutoRolledCount = 0;
const daemonLogs: Array<{ time: string; message: string; type: 'info' | 'roll' | 'error' }> = [];

function logDaemon(message: string, type: 'info' | 'roll' | 'error' = 'info') {
  const time = new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
  daemonLogs.unshift({ time, message, type });
  if (daemonLogs.length > 50) daemonLogs.pop();
  console.log(`[Daemon 24/7 ${time}] ${message}`);
}

async function postBossToWebhook(boss: any, webhookUrl: string) {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

  const lastKilledTime = boss.lastKilledAt 
    ? new Date(boss.lastKilledAt).toLocaleTimeString('vi-VN', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }) 
    : '';
  const nextSpawnTime = boss.nextSpawnAt 
    ? new Date(boss.nextSpawnAt).toLocaleTimeString('vi-VN', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }) 
    : '';
  const timeUpdateAuto = boss.timeUpdateAuto || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const bossCat = boss.category === 'invasion' || (boss.id && boss.id.includes('invasion')) ? 'invasion' : 'local';
  const sheetName = bossCat === 'invasion' ? 'Invasion' : 'Boss';

  const webhookPayload = {
    action: 'updateBoss',
    bossId: boss.id,
    bossName: boss.name,
    bossNameEn: boss.nameEn,
    category: bossCat,
    sheetName: sheetName,
    sheetId: serverDaemonConfig.sheetId,
    channel: boss.channel,
    map: boss.map,
    respawnMinutes: boss.respawnMinutes,
    lastKilledAt: boss.lastKilledAt,
    nextSpawnAt: boss.nextSpawnAt,
    lastKilledTime,
    nextSpawnTime,
    updateAuto: boss.updateAuto || 'Yes',
    timeUpdateAuto,
    source: 'server_daemon_24_7',
    timestamp: new Date().toISOString()
  };

  const gResponse = await fetch(webhookUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webhookPayload),
  });

  return gResponse.ok;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Proxy Endpoint for Google Sheet CSV Data
  app.get('/api/sheet-data', async (req, res) => {
    // Ensure response is never cached by browser or proxy
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const sheetIdParam = req.query.sheetId as string;
    const sheetUrlParam = req.query.sheetUrl as string;

    const fullUrl = sheetUrlParam || sheetIdParam || 'https://docs.google.com/spreadsheets/d/1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr/edit?gid=663302635#gid=663302635';

    // Extract sheetId and gid
    let sheetId = '1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr';
    let gid = '0';

    const idMatch = fullUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (idMatch && idMatch[1]) {
      sheetId = idMatch[1];
    }
    const gidMatch = fullUrl.match(/[?&]gid=([0-9]+)/) || fullUrl.match(/#gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    } else if (sheetId === '1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr') {
      gid = '663302635';
    }

    const timestamp = Date.now();
    // URLs for Local Bosses
    const csvExportUrls = [
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&_t=${timestamp}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=tsv&gid=${gid}&_t=${timestamp}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}&_t=${timestamp}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0&_t=${timestamp}`,
    ];

    // URLs for Invasion Bosses
    const invasionExportUrls = [
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Invasion&_t=${timestamp}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=Invasion&_t=${timestamp}`,
    ];

    async function fetchCsvFromUrls(urls: string[]): Promise<string> {
      for (const exportUrl of urls) {
        try {
          const response = await fetch(exportUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          });
          if (response.ok) {
            const text = await response.text();
            if (
              !text.includes('<!doctype html>') &&
              !text.includes('<html') &&
              !text.includes('accounts.google.com') &&
              text.trim().length > 0
            ) {
              return text;
            }
          }
        } catch (e) {
          // try next
        }
      }
      return '';
    }

    const [localCsv, invasionCsv] = await Promise.all([
      fetchCsvFromUrls(csvExportUrls),
      fetchCsvFromUrls(invasionExportUrls),
    ]);

    const isForce = req.query.force === 'true' || req.query.forceDrive === 'true';

    // Intelligent 2-way sync merger:
    // Merges live Google Sheet CSV with server cache.
    // CRITICAL: NEVER overwrite user manual edits entered in Boss Timer with older Google Sheet data!
    function mergeSheetDataWithCache(liveBosses: any[], cachedBosses: any[]): any[] {
      return liveBosses.map(liveB => {
        const cached = cachedBosses.find(c => c.id === liveB.id || c.name.toLowerCase() === liveB.name.toLowerCase());
        if (!cached) return liveB;

        const cachedKillMs = cached.lastKilledAt ? new Date(cached.lastKilledAt).getTime() : 0;
        const liveKillMs = liveB.lastKilledAt ? new Date(liveB.lastKilledAt).getTime() : 0;

        // If local user entered a time in Boss Timer (has lastModifiedAt):
        const isUserEditedRecently = cached.lastModifiedAt && (Date.now() - cached.lastModifiedAt < 86400000); // 24h window

        // Protect user-entered spawn times from being wiped out by outdated sheet reads
        if (isUserEditedRecently && cached.nextSpawnAt) {
          return {
            ...liveB,
            lastKilledAt: cached.lastKilledAt,
            nextSpawnAt: cached.nextSpawnAt,
            status: cached.status,
            updateAuto: cached.updateAuto || liveB.updateAuto,
            timeUpdateAuto: cached.timeUpdateAuto || liveB.timeUpdateAuto,
            lastModifiedAt: cached.lastModifiedAt,
          };
        }

        // Otherwise Google Sheet has newer data: update from sheet
        return liveB;
      });
    }

    if (localCsv) {
      const liveLocal = parseCSVToBossArray(localCsv, 'local');
      if (serverLocalBossesCache.length === 0) {
        serverLocalBossesCache = liveLocal;
      } else {
        serverLocalBossesCache = mergeSheetDataWithCache(liveLocal, serverLocalBossesCache);
      }
    }

    if (invasionCsv) {
      const liveInvasion = parseCSVToBossArray(invasionCsv, 'invasion');
      if (serverInvasionBossesCache.length === 0) {
        serverInvasionBossesCache = liveInvasion;
      } else {
        serverInvasionBossesCache = mergeSheetDataWithCache(liveInvasion, serverInvasionBossesCache);
      }
    }

    serverBossesCache = [...serverLocalBossesCache, ...serverInvasionBossesCache];

    const tabParam = req.query.tab as string;
    let returnedBosses = serverBossesCache;
    if (tabParam === 'local') {
      returnedBosses = serverLocalBossesCache;
    } else if (tabParam === 'invasion') {
      returnedBosses = serverInvasionBossesCache;
    }

    if (localCsv || invasionCsv) {
      return res.json({
        success: true,
        sheetId,
        gid,
        message: 'Successfully fetched live Google Sheet CSV (Local & Invasion)',
        bosses: returnedBosses,
        localBosses: serverLocalBossesCache,
        invasionBosses: serverInvasionBossesCache,
        allBosses: serverBossesCache,
      });
    }

    // Fallback response when Sheet link is private or requires Google Login
    return res.json({
      success: false,
      sheetId,
      gid,
      isProtected: true,
      message: 'Sheet requires permission or login. Returned live synchronized schedule cache.',
      bosses: returnedBosses,
      localBosses: serverLocalBossesCache,
      invasionBosses: serverInvasionBossesCache,
      allBosses: serverBossesCache,
    });
  });

  // API to update boss or sync back to Google Drive / Sheet
  app.post('/api/sheet-update', async (req, res) => {
    try {
      const { sheetUrl, sheetId, webhookUrl, boss, allBosses } = req.body;

      if (!boss && !allBosses) {
        return res.status(400).json({ success: false, message: 'Missing boss data to update' });
      }

      const bossToUpdate = boss || (allBosses && allBosses[0]);
      console.log(`[API /api/sheet-update] Updating boss: ${bossToUpdate?.name}, lastKilledAt: ${bossToUpdate?.lastKilledAt}, nextSpawnAt: ${bossToUpdate?.nextSpawnAt}, updateAuto: ${bossToUpdate?.updateAuto}`);

      let driveSyncSuccess = false;
      let driveMessage = 'Đã ghi nhận cập nhật vào bộ nhớ cache hệ thống';

      // Determine effective webhook URL (from body or serverDaemonConfig)
      const effectiveWebhook = (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.startsWith('http')) 
        ? webhookUrl.trim() 
        : (serverDaemonConfig.webhookUrl && serverDaemonConfig.webhookUrl.startsWith('http') ? serverDaemonConfig.webhookUrl.trim() : '');

      const effectiveSheetId = sheetId || serverDaemonConfig.sheetId || '1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr';
      const bossCategory: 'local' | 'invasion' = bossToUpdate.category === 'invasion' || (bossToUpdate.id && bossToUpdate.id.includes('invasion')) 
        ? 'invasion' 
        : 'local';
      const sheetName = bossCategory === 'invasion' ? 'Invasion' : 'Boss';

      // 1. If webhookUrl is provided (Google Apps Script Web App), forward update to Google Drive
      if (effectiveWebhook) {
        try {
          const lastKilledTime = bossToUpdate.lastKilledAt 
            ? new Date(bossToUpdate.lastKilledAt).toLocaleTimeString('vi-VN', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }) 
            : '';
          const nextSpawnTime = bossToUpdate.nextSpawnAt 
            ? new Date(bossToUpdate.nextSpawnAt).toLocaleTimeString('vi-VN', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }) 
            : '';
          const timeUpdateAuto = bossToUpdate.timeUpdateAuto || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

          const webhookPayload = {
            action: 'updateBoss',
            bossId: bossToUpdate.id,
            bossName: bossToUpdate.name,
            bossNameEn: bossToUpdate.nameEn,
            category: bossCategory,
            sheetName: sheetName,
            sheetId: effectiveSheetId,
            channel: bossToUpdate.channel,
            map: bossToUpdate.map,
            respawnMinutes: bossToUpdate.respawnMinutes,
            lastKilledAt: bossToUpdate.lastKilledAt,
            nextSpawnAt: bossToUpdate.nextSpawnAt,
            lastKilledTime,
            nextSpawnTime,
            updateAuto: bossToUpdate.updateAuto || 'No',
            timeUpdateAuto,
            source: 'boss_timer_ui',
            timestamp: new Date().toISOString()
          };

          const gResponse = await fetch(effectiveWebhook, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload),
          });

          const resBody = await gResponse.text();
          console.log('[API /api/sheet-update] Apps Script responded:', gResponse.status, resBody);

          if (gResponse.ok) {
            driveSyncSuccess = true;
            driveMessage = `Đã đồng bộ cập nhật 2 chiều vào Google Sheet (${sheetName} - Cột H, I, K, L) thành công!`;
          } else {
            driveMessage = `Google Apps Script phản hồi mã lỗi ${gResponse.status}`;
          }
        } catch (webhookErr: any) {
          console.warn('Failed to call Google Apps Script webhook:', webhookErr.message);
          driveMessage = `Không thể kết nối Webhook Google Drive: ${webhookErr.message}`;
        }
      } else {
        driveMessage = 'Chưa cấu hình URL Webhook Google Sheet. Dữ liệu đã lưu an toàn trong bộ nhớ máy chủ (không bị ghi đè khi đồng bộ sheet).';
      }

      // 2. Update server caches with lastModifiedAt (Crucial for 2-way sync precedence)
      const nowMs = Date.now();
      const updatedBossWithMeta = {
        ...bossToUpdate,
        category: bossCategory,
        lastModifiedAt: nowMs,
      };

      if (bossCategory === 'invasion') {
        const idx = serverInvasionBossesCache.findIndex(b => b.id === updatedBossWithMeta.id || b.name.toLowerCase() === updatedBossWithMeta.name.toLowerCase());
        if (idx >= 0) {
          serverInvasionBossesCache[idx] = { ...serverInvasionBossesCache[idx], ...updatedBossWithMeta };
        } else {
          serverInvasionBossesCache.push(updatedBossWithMeta);
        }
      } else {
        const idx = serverLocalBossesCache.findIndex(b => b.id === updatedBossWithMeta.id || b.name.toLowerCase() === updatedBossWithMeta.name.toLowerCase());
        if (idx >= 0) {
          serverLocalBossesCache[idx] = { ...serverLocalBossesCache[idx], ...updatedBossWithMeta };
        } else {
          serverLocalBossesCache.push(updatedBossWithMeta);
        }
      }

      // Also update combined cache
      const combinedIdx = serverBossesCache.findIndex(b => b.id === updatedBossWithMeta.id || b.name.toLowerCase() === updatedBossWithMeta.name.toLowerCase());
      if (combinedIdx >= 0) {
        serverBossesCache[combinedIdx] = { ...serverBossesCache[combinedIdx], ...updatedBossWithMeta };
      } else {
        serverBossesCache.push(updatedBossWithMeta);
      }

      if (Array.isArray(allBosses)) {
        for (const b of allBosses) {
          const cat = b.category === 'invasion' || (b.id && b.id.includes('invasion')) ? 'invasion' : 'local';
          const bMeta = { ...b, category: cat, lastModifiedAt: nowMs };
          if (cat === 'invasion') {
            const iIdx = serverInvasionBossesCache.findIndex(item => item.id === b.id || item.name.toLowerCase() === b.name.toLowerCase());
            if (iIdx >= 0) serverInvasionBossesCache[iIdx] = { ...serverInvasionBossesCache[iIdx], ...bMeta };
            else serverInvasionBossesCache.push(bMeta);
          } else {
            const lIdx = serverLocalBossesCache.findIndex(item => item.id === b.id || item.name.toLowerCase() === b.name.toLowerCase());
            if (lIdx >= 0) serverLocalBossesCache[lIdx] = { ...serverLocalBossesCache[lIdx], ...bMeta };
            else serverLocalBossesCache.push(bMeta);
          }
          const cIdx = serverBossesCache.findIndex(item => item.id === b.id || item.name.toLowerCase() === b.name.toLowerCase());
          if (cIdx >= 0) serverBossesCache[cIdx] = { ...serverBossesCache[cIdx], ...bMeta };
          else serverBossesCache.push(bMeta);
        }
      }

      return res.json({
        success: true,
        driveSyncSuccess,
        message: driveMessage,
        updatedBoss: updatedBossWithMeta,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error in /api/sheet-update:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Server Daemon Status Endpoint: Tra cứu trạng thái chạy ngầm 24/7 của máy chủ
  app.get('/api/server-daemon/status', (req, res) => {
    return res.json({
      status: {
        enabled: serverDaemonConfig.enabled,
        isRunning: true,
        lastRunAt: lastDaemonRunAt,
        totalAutoRolledCount,
        autoRollMode: serverDaemonConfig.autoRollMode,
        webhookConfigured: Boolean(serverDaemonConfig.webhookUrl && serverDaemonConfig.webhookUrl.startsWith('http')),
        webhookUrl: serverDaemonConfig.webhookUrl,
        sheetId: serverDaemonConfig.sheetId,
        sheetUrl: serverDaemonConfig.sheetUrl,
        intervalSeconds: serverDaemonConfig.intervalSeconds,
        logs: daemonLogs.slice(0, 25),
      }
    });
  });

  // Server Daemon Config Endpoint: Cập nhật cấu hình chạy ngầm (Webhook URL, Sheet URL, Chế độ cuộn)
  app.post('/api/server-daemon/config', (req, res) => {
    try {
      const { sheetUrl, sheetId, webhookUrl, autoRollMode, enabled } = req.body;
      if (typeof sheetUrl === 'string' && sheetUrl) {
        serverDaemonConfig.sheetUrl = sheetUrl;
        const idMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch && idMatch[1]) serverDaemonConfig.sheetId = idMatch[1];
        const gidMatch = sheetUrl.match(/[?&]gid=([0-9]+)/) || sheetUrl.match(/#gid=([0-9]+)/);
        if (gidMatch && gidMatch[1]) serverDaemonConfig.gid = gidMatch[1];
      }
      if (typeof sheetId === 'string' && sheetId) {
        serverDaemonConfig.sheetId = sheetId;
      }
      if (typeof webhookUrl === 'string') {
        serverDaemonConfig.webhookUrl = webhookUrl.trim();
      }
      if (autoRollMode && ['all', '100_only', 'disabled'].includes(autoRollMode)) {
        serverDaemonConfig.autoRollMode = autoRollMode;
      }
      if (typeof enabled === 'boolean') {
        serverDaemonConfig.enabled = enabled;
      }

      saveServerDaemonConfig();
      logDaemon(`Cập nhật cấu hình Server 24/7: Mode=${serverDaemonConfig.autoRollMode}, Webhook=${serverDaemonConfig.webhookUrl ? 'Sẵn sàng' : 'Chưa nhập'}`, 'info');

      // Kích hoạt 1 vòng quét ngay lập tức
      runServerDaemonTick().catch(e => console.warn('Trigger tick err:', e));

      return res.json({
        success: true,
        message: 'Đã lưu cấu hình máy chủ chạy ngầm 24/7 thành công!',
        status: {
          enabled: serverDaemonConfig.enabled,
          isRunning: true,
          lastRunAt: lastDaemonRunAt,
          totalAutoRolledCount,
          autoRollMode: serverDaemonConfig.autoRollMode,
          webhookConfigured: Boolean(serverDaemonConfig.webhookUrl && serverDaemonConfig.webhookUrl.startsWith('http')),
          webhookUrl: serverDaemonConfig.webhookUrl,
          sheetId: serverDaemonConfig.sheetId,
          sheetUrl: serverDaemonConfig.sheetUrl,
          logs: daemonLogs.slice(0, 25),
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Server Daemon Trigger Endpoint: Kích hoạt quét và tính lại ngay lập tức
  app.post('/api/server-daemon/trigger-now', async (req, res) => {
    try {
      const result = await runServerDaemonTick();
      return res.json({
        success: true,
        message: 'Đã kích hoạt quét thủ công thành công!',
        rolledCount: result?.rolledCount || 0,
        rolledBosses: result?.rolledBosses || [],
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Export CSV endpoint matching exact 12 columns (Col A to Col L) with Column K (Update Auto) & Column L (Time Update Auto)
  app.get('/api/export-csv', (req, res) => {
    try {
      const headers = [
        'STT',
        'Tên Boss',
        'Boss name',
        'Địa Điểm',
        'Location',
        'Clan',
        '%',
        'Thời Gian chết',
        'Xuất Hiện',
        'Thời gian xuất hiện lại (spawn)',
        'Update Auto',
        'Time Update Auto'
      ];

      const rows = serverBossesCache.map((b, idx) => {
        const lastKill = b.lastKilledAt ? new Date(b.lastKilledAt).toLocaleTimeString('vi-VN', { hour12: false }) : '';
        const nextSpawn = b.nextSpawnAt ? new Date(b.nextSpawnAt).toLocaleTimeString('vi-VN', { hour12: false }) : '';
        const updateAuto = b.updateAuto || 'No';
        const timeAuto = b.timeUpdateAuto || '';
        const respawnFormatted = `${Math.floor(b.respawnMinutes / 60)}:${String(b.respawnMinutes % 60).padStart(2, '0')}:00`;
        return [
          idx + 1,
          `"${(b.name || '').replace(/"/g, '""')}"`,
          `"${(b.nameEn || b.name || '').replace(/"/g, '""')}"`,
          `"${(b.map || '').replace(/"/g, '""')}"`,
          `"${(b.mapEn || b.map || '').replace(/"/g, '""')}"`,
          `"${b.channel || 'Kênh 1'}"`,
          `"${b.spawnRate || '100%'}"`,
          `"${lastKill}"`,
          `"${nextSpawn}"`,
          `"${respawnFormatted}"`,
          `"${updateAuto}"`,
          `"${timeAuto}"`
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="boss_schedule_columns_A_to_L.csv"');
      return res.send(csvContent);
    } catch (err: any) {
      return res.status(500).send(`Export failed: ${err.message}`);
    }
  });

  // Helper function to parse any time or date string from Google Sheets
  function parseSheetDateTime(
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
    // Get current date components in Vietnam / ICT (UTC+7)
    const ictDate = new Date(nowMs + (7 * 60 * 60 * 1000));
    const curYear = ictDate.getUTCFullYear();
    const curMonth = ictDate.getUTCMonth();
    const curDay = ictDate.getUTCDate();

    // 1. Time only format: "13:23:50", "13:23", "13h23", "01:23:50 PM", "1:23 PM"
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

  function parseCooldownToMinutes(raw: string | undefined | null): number {
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

  // Helper inside server to turn CSV/TSV lines to Boss array
  function parseCSVToBossArray(csvText: string, category: 'local' | 'invasion' = 'local') {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return category === 'local' ? DEFAULT_BOSSES_DATA : [];

    const isTabSeparated = lines[0].includes('\t');

    const parseLine = (line: string) => {
      if (isTabSeparated) {
        return line.split('\t').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
      }
      const parts: string[] = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inQ = !inQ;
        else if (c === ',' && !inQ) {
          parts.push(cur.trim());
          cur = '';
        } else cur += c;
      }
      parts.push(cur.trim());
      return parts;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
    const bosses: any[] = [];

    // 1. Name indices
    const nameIdx = headers.findIndex(h => h === 'tên boss' || h.includes('tên boss') || h.includes('tên') || h.includes('quái') || h === 'boss');
    const nameEnIdx = headers.findIndex((h, idx) => idx !== nameIdx && (h.includes('boss name') || h.includes('english') || h.includes('en') || h === 'name'));

    // 2. Map / Location indices
    const mapIdx = headers.findIndex(h => h.includes('địa điểm') || h.includes('dia diem') || h.includes('bản đồ') || h.includes('khu vực') || h.includes('map') || h.includes('vị trí'));
    const mapEnIdx = headers.findIndex((h, idx) => idx !== mapIdx && (h.includes('location') || h.includes('map en') || h.includes('bản đồ en')));

    // 3. Cooldown / Respawn time
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

    // 4. Last killed time
    const lastKillIdx = headers.findIndex(h => 
      h.includes('chết') || 
      h.includes('chet') || 
      h.includes('diệt') || 
      h.includes('diet') || 
      h.includes('lần cuối') || 
      h.includes('lan cuoi') || 
      h.includes('last kill')
    );

    // 5. Next spawn time
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
      const cols = parseLine(lines[i]);
      if (cols.length < 1 || cols.every(c => c === '')) continue;

      let rawName = cols[nameIdx >= 0 ? nameIdx : 0]?.trim();
      if (nameIdx < 0 && /^\d+$/.test(rawName) && cols.length > 1) {
        rawName = cols[1]?.trim();
      }

      if (!rawName || rawName === '' || /^tên\s*boss$/i.test(rawName) || /^stt$/i.test(rawName) || /^tên$/i.test(rawName) || /^name$/i.test(rawName) || /^tổng/i.test(rawName) || /^ghi\s*chú/i.test(rawName)) {
        continue;
      }

      const name = rawName;
      const nameEn = (nameEnIdx >= 0 && cols[nameEnIdx]?.trim()) ? cols[nameEnIdx].trim() : undefined;
      const map = (mapIdx >= 0 && cols[mapIdx]?.trim()) ? cols[mapIdx].trim() : (cols[1] || 'Khu Vực Trung Tâm');
      const mapEn = (mapEnIdx >= 0 && cols[mapEnIdx]?.trim()) ? cols[mapEnIdx].trim() : undefined;
      const channel = (clanIdx >= 0 && cols[clanIdx]?.trim()) ? cols[clanIdx].trim() : 'Kênh 1';

      const rawCdStr = cdIdx >= 0 ? cols[cdIdx] : (cols[8] || cols[11] || '60');
      let cdMins = parseCooldownToMinutes(rawCdStr);

      let level = parseInt(cols[levelIdx >= 0 ? levelIdx : 4] || '100', 10);
      if (isNaN(level)) level = 90;

      const rawLastKill = lastKillIdx >= 0 ? cols[lastKillIdx] : cols[6];
      const rawNextSpawn = nextSpawnIdx >= 0 ? cols[nextSpawnIdx] : cols[7];

      const nowMs = Date.now();
      let lastKilledAt = parseSheetDateTime(rawLastKill, { isKillTime: true, nowMs });
      let nextSpawnAt = parseSheetDateTime(rawNextSpawn, { nowMs });

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

      let status = 'cooldown';
      if (nextSpawnAt) {
        const diffMs = new Date(nextSpawnAt).getTime() - Date.now();
        if (diffMs <= 0) status = 'alive';
        else if (diffMs <= 30 * 60 * 1000) status = 'soon';
      } else if (!lastKilledAt && !nextSpawnAt) {
        status = 'unknown';
      }

      const rawRate = rateIdx >= 0 ? cols[rateIdx] : cols[5];
      const spawnRate = rawRate && rawRate.trim() ? (rawRate.includes('%') ? rawRate.trim() : `${rawRate.trim()}%`) : '100%';

      // Parse Is Big Boss from column K (or header matching "is big boss")
      let isBigBoss = false;
      const rawBigBoss = (bigBossIdx >= 0 ? cols[bigBossIdx] : cols[10])?.trim().toLowerCase();
      if (rawBigBoss === 'yes' || rawBigBoss === 'y' || rawBigBoss === 'có' || rawBigBoss === 'co' || rawBigBoss === '1' || rawBigBoss === 'true' || rawBigBoss === 'x') {
        isBigBoss = true;
      }

      // Parse Update Auto & Time Update Auto values from sheet (Column L and Column M if K is Big Boss)
      let updateAuto: 'Yes' | 'No' = 'No';
      const autoColVal = updateAutoIdx >= 0 ? cols[updateAutoIdx] : cols[11];
      if (autoColVal) {
        const uVal = autoColVal.trim().toLowerCase();
        if (uVal === 'yes' || uVal === 'y' || uVal === 'có' || uVal === 'co' || uVal === '1' || uVal === 'true') {
          updateAuto = 'Yes';
        } else if (uVal === 'no' || uVal === 'n' || uVal === 'không' || uVal === 'khong' || uVal === '0' || uVal === 'false') {
          updateAuto = 'No';
        }
      }

      const rawTimeAuto = timeUpdateAutoIdx >= 0 ? cols[timeUpdateAutoIdx]?.trim() : (cols[12]?.trim() || null);
      const timeUpdateAuto = rawTimeAuto && rawTimeAuto !== '-' && rawTimeAuto !== '--:--' ? rawTimeAuto : null;

      bosses.push({
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
        status,
        drops: [],
        spawnRate,
        isBigBoss,
        updateAuto,
        timeUpdateAuto,
        category,
      });
    }

    return bosses;
  }

  // Background Runner for Daemon (Chạy ngầm 24/7 trên máy chủ kể cả khi tắt trình duyệt / không ai mở app)
  async function runServerDaemonTick(): Promise<{ rolledCount: number; rolledBosses: any[] }> {
    if (!serverDaemonConfig.enabled || serverDaemonConfig.autoRollMode === 'disabled') {
      return { rolledCount: 0, rolledBosses: [] };
    }

    const nowMs = Date.now();
    lastDaemonRunAt = new Date().toISOString();

    const rolledBosses: any[] = [];

    for (let i = 0; i < serverBossesCache.length; i++) {
      const b = serverBossesCache[i];
      if (!b.respawnMinutes || b.respawnMinutes <= 0) continue;

      let baseSpawnMs: number | null = null;
      if (b.nextSpawnAt) {
        baseSpawnMs = new Date(b.nextSpawnAt).getTime();
      } else if (b.lastKilledAt) {
        baseSpawnMs = new Date(b.lastKilledAt).getTime() + b.respawnMinutes * 60 * 1000;
      }

      if (!baseSpawnMs || isNaN(baseSpawnMs)) continue;

      // Nếu giờ xuất hiện <= giờ hiện tại (đợi ít nhất 1 phút sau khi ra để giữ trạng thái SPAWN cho người xem)
      if (nowMs >= baseSpawnMs + 60 * 1000) {
        // Kiểm tra chế độ cuộn
        if (serverDaemonConfig.autoRollMode === '100_only') {
          const rate = (b.spawnRate || '').trim();
          const is100 = rate === '100%' || rate === '100' || rate === '';
          if (!is100) continue;
        }

        // Bỏ qua giờ chết, lấy giờ xuất hiện làm mốc tính chu kỳ mới
        const cdMs = b.respawnMinutes * 60 * 1000;
        let cycleSpawnMs = baseSpawnMs;
        let lastCycleMs = baseSpawnMs;
        while (cycleSpawnMs <= nowMs && cdMs > 0) {
          lastCycleMs = cycleSpawnMs;
          cycleSpawnMs += cdMs;
        }

        const newSpawnDate = new Date(cycleSpawnMs);
        const newKillDate = new Date(lastCycleMs);
        const nowVNStr = new Date(nowMs).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });

        b.lastKilledAt = newKillDate.toISOString();
        b.nextSpawnAt = newSpawnDate.toISOString();
        b.updateAuto = 'Yes';
        b.timeUpdateAuto = nowVNStr;
        b.status = (cycleSpawnMs - nowMs <= 30 * 60 * 1000) ? 'soon' : 'cooldown';

        totalAutoRolledCount++;
        rolledBosses.push(b);

        const newSpawnTimeStr = newSpawnDate.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
        logDaemon(`⚡ [Chạy ngầm 24/7] [${b.name}] (${b.spawnRate || '100%'}) quá giờ xuất hiện! Đã tính lại: Giờ ra mới = ${newSpawnTimeStr}`, 'roll');
      }
    }

    // Đẩy ngược lên Google Sheet qua Webhook
    if (rolledBosses.length > 0 && serverDaemonConfig.webhookUrl && serverDaemonConfig.webhookUrl.startsWith('http')) {
      for (const b of rolledBosses) {
        try {
          const ok = await postBossToWebhook(b, serverDaemonConfig.webhookUrl);
          if (ok) {
            logDaemon(`Đã đồng bộ [${b.name}] lên Google Sheet (Cột H, I, K, L) qua Webhook thành công`, 'info');
          } else {
            logDaemon(`Webhook trả về lỗi khi cập nhật [${b.name}]`, 'error');
          }
        } catch (err: any) {
          logDaemon(`Lỗi gửi Webhook cho [${b.name}]: ${err.message}`, 'error');
        }
      }
    }

    return { rolledCount: rolledBosses.length, rolledBosses };
  }

  // Tự động kéo dữ liệu từ Google Sheet mỗi 2 phút để nhận các thay đổi người dùng nhập trực tiếp trên Sheet
  let lastBackgroundSheetFetch = 0;
  async function runBackgroundSheetSync() {
    const now = Date.now();
    if (now - lastBackgroundSheetFetch < 120000) return; // Mỗi 2 phút
    lastBackgroundSheetFetch = now;

    try {
      const sheetId = serverDaemonConfig.sheetId || '1sode1asg4RnRhsig4x6jzVYhB-Oa4gBr';
      const gid = serverDaemonConfig.gid || '0';
      const localExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&_t=${now}`;
      const invasionExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Invasion&_t=${now}`;
      
      const [respLocal, respInno] = await Promise.all([
        fetch(localExportUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' },
        }).catch(() => null),
        fetch(invasionExportUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' },
        }).catch(() => null),
      ]);

      if (respLocal && respLocal.ok) {
        const text = await respLocal.text();
        if (!text.includes('<!doctype html>') && !text.includes('accounts.google.com') && text.trim().length > 0) {
          const liveLocal = parseCSVToBossArray(text, 'local');
          if (liveLocal && liveLocal.length > 0) {
            serverLocalBossesCache = liveLocal;
          }
        }
      }

      if (respInno && respInno.ok) {
        const text = await respInno.text();
        if (!text.includes('<!doctype html>') && !text.includes('accounts.google.com') && text.trim().length > 0) {
          const liveInno = parseCSVToBossArray(text, 'invasion');
          if (liveInno && liveInno.length > 0) {
            serverInvasionBossesCache = liveInno;
          }
        }
      }

      serverBossesCache = [...serverLocalBossesCache, ...serverInvasionBossesCache];
    } catch (err) {
      // Bỏ qua lỗi kết nối tạm thời
    }
  }

  // Bắt đầu vòng lặp chạy ngầm Server Daemon (Mỗi 10 giây một lần)
  const DAEMON_INTERVAL_MS = 10000;
  setInterval(() => {
    runServerDaemonTick().catch(e => console.warn('[Daemon tick error]:', e));
    runBackgroundSheetSync().catch(e => console.warn('[Daemon sheet sync error]:', e));
  }, DAEMON_INTERVAL_MS);

  // Kích hoạt 1 lần sau khi server khởi động 2 giây
  setTimeout(() => {
    logDaemon('🚀 Server Daemon 24/7 đã khởi động! Sẵn sàng tự động cập nhật giờ Boss kể cả khi không ai mở app.', 'info');
    runServerDaemonTick().catch(e => console.warn('[Daemon init tick error]:', e));
  }, 2000);

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
