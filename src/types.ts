export type Language = 'vi' | 'en';
export type Theme = 'light' | 'dark';
export type ViewMode = 'table' | 'scorecard';
export type BossStatus = 'alive' | 'soon' | 'cooldown' | 'unknown';

export interface Boss {
  id: string;
  name: string;
  nameEn?: string;
  map: string;
  mapEn?: string;
  channel: string;
  level: number;
  hp?: string;
  respawnMinutes: number; // Respawn cooldown in minutes
  lastKilledAt: string | null; // ISO Date string or null
  nextSpawnAt: string | null; // ISO Date string or null
  status: BossStatus;
  drops: string[];
  dropsEn?: string[];
  notes?: string;
  image?: string;
  element?: 'fire' | 'water' | 'earth' | 'wind' | 'dark' | 'light';
  spawnRate?: string; // Tỷ lệ xuất hiện (VD: "100%", "80%", "70%")
  isBigBoss?: boolean; // Cột K: Is big boss (Yes/No)
  updateAuto?: 'Yes' | 'No'; // Cập nhật tự động (Yes/No)
  timeUpdateAuto?: string | null; // Thời gian cập nhật tự động gần nhất
  category?: 'local' | 'invasion'; // Phân loại: Local Boss hoặc Invasion
  lastModifiedAt?: number; // Timestamp lúc người dùng chỉnh sửa gần nhất (cho 2-way sync)
}

export type BossCategory = 'local' | 'invasion';

export type AutoRollMode = 'all' | '100_only' | 'disabled';

export interface ServerDaemonStatus {
  enabled: boolean;
  isRunning: boolean;
  lastRunAt: string | null;
  totalAutoRolledCount: number;
  autoRollMode: AutoRollMode;
  webhookConfigured: boolean;
  webhookUrl?: string;
  sheetId?: string;
  logs?: Array<{ time: string; message: string; type: 'info' | 'roll' | 'error' }>;
}

export interface SheetConfig {
  sheetUrl: string;
  sheetId: string;
  sheetName: string;
  autoSync: boolean;
  syncIntervalSeconds: number;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  webhookUrl?: string; // URL Google Apps Script Webhook để update ngược về file Google Drive / Sheet
  autoRollMode?: AutoRollMode; // Tự động tính lại giờ xuất hiện: 'all' (Tất cả boss, không quan tâm % tỉ lệ), '100_only', 'disabled'
}

export interface FilterState {
  searchQuery: string;
  status: 'all' | 'alive' | 'soon' | 'cooldown';
  channel: string;
  map: string;
  sortBy: 'nextSpawn' | 'name' | 'level' | 'cooldown';
  sortOrder: 'asc' | 'desc';
  in30MinsOnly?: boolean;
  upcomingWindow?: 'all' | '30m' | '60m';
  bigBossOnly?: boolean;
  category?: 'all' | 'local' | 'invasion'; // Lọc loại: Tất cả (mặc định), Local Boss hoặc Invasion
}

export interface KPIStatsData {
  total: number;
  alive: number;
  soon: number;
  cooldown: number;
}

export type UserRole = 'admin' | 'leader' | 'member';

export const SUPER_ADMIN_EMAIL = 'dinhvohoangdong@gmail.com';

export interface AllowedUser {
  email: string;
  role: UserRole;
  addedBy?: string;
  addedAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  displayName?: string;
  photoURL?: string;
  inGameName?: string; // Tên nhân vật trong game (In-Game Name - IGN)
}

export interface AccessRequest {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  inGameName?: string; // Tên nhân vật gửi cùng yêu cầu
}

export type ReportStatus = 'pending' | 'verified' | 'rejected' | 'fixed';

export interface BossTimeReport {
  id: string;
  bossId: string;
  bossName: string;
  bossMap?: string;
  channel?: string;
  reportedBy: string;
  reportedByDisplayName?: string;
  reportedAt: string;
  note?: string;
  status: ReportStatus;
  updatedBy?: string;
  updatedAt?: string;
  statusNote?: string;
}
