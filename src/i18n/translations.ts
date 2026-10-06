import { Language } from '../types';

export const translations = {
  vi: {
    appTitle: 'Boss Timer & Schedule Tracker',
    appSubtitle: 'Hệ thống theo dõi thời gian Boss xuất hiện tự động đồng bộ từ Google Sheet',
    horizontalTable: 'Dạng Bảng',
    scoreCardView: 'Dạng Thẻ',
    syncSheet: 'Đồng Bộ Sheet',
    syncing: 'Đang Đồng Bộ...',
    lastSynced: 'Đồng bộ lúc',
    sheetConfig: 'Cấu Hình Sheet',
    addBoss: 'Thêm Boss Mới',
    searchPlaceholder: 'Tìm theo tên Boss...',
    allStatus: 'Tất Cả',
    aliveOnly: '🔴 Đã Ra',
    soonOnly: '🟡 Sắp Ra (<15p)',
    cooldownOnly: '🔵 Đang Hồi Chiêu',
    unknownOnly: '⚪ Chưa Báo Giờ',
    allMaps: 'Tất Cả Bản Đồ',
    allChannels: 'Tất Cả Kênh',
    sortBy: 'Sắp Xếp Theo',
    sortNextSpawn: 'Thời gian ra (24H)',
    sortLevel: 'Cấp độ Boss',
    sortName: 'Tên Boss (A-Z)',
    sortCooldown: 'Thời gian hồi chiêu',
    
    // KPI Cards
    kpiTotal: 'Tổng Số Boss',
    kpiAlive: 'Đã Xuất Hiện',
    kpiSoon: 'Sắp Xuất Hiện (<15p)',
    kpiCooldown: 'Đang Hồi Chiêu',
    
    // Status badges
    statusAlive: 'ĐÃ XUẤT HIỆN',
    statusSoon: 'SẮP XUẤT HIỆN',
    statusCooldown: 'ĐANG HỒI CHIÊU',
    statusUnknown: 'CHƯA XÁC ĐỊNH',

    // Table Headers
    thBoss: 'Tên Boss',
    thRate: 'Tỉ Lệ Ra',
    thLevel: 'Cấp Độ',
    thMap: 'Bản Đồ',
    thChannel: 'Kênh / Sv',
    thCooldown: 'Thời Gian Hồi',
    thLastKill: 'Lần Cuối Diệt',
    thNextSpawn: 'Thời Gian Ra (24H)',
    thSpawnTime: 'Thời Gian Ra (24H)',
    thTimer: 'Đếm Ngược',
    thCountdown: 'Đếm Ngược',
    thStatus: 'Trạng Thái',
    thActions: 'Thao Tác',
    
    // Actions
    markKilled: 'Đã Diệt Boss',
    viewDetails: 'Xem Chi Tiết',
    editBoss: 'Sửa',
    deleteBoss: 'Xóa',
    resetTimer: 'Đặt Lai Giờ',
    
    // Boss Card
    respawnProgress: 'Tiến độ hồi chiêu',
    dropItems: 'Vật phẩm rớt',
    recommendedLevel: 'Lv Khuyên Dùng',
    hpBar: 'Lượng Máu (HP)',

    // Sheet Config Modal
    configTitle: 'Cấu Hình Kết Nối Google Sheet',
    configSubtitle: 'Liên kết ứng dụng với file Google Sheet chứa lịch Boss của bạn',
    sheetUrlLabel: 'Đường Dẫn Google Sheet (URL)',
    sheetUrlHelp: 'Dán link Google Sheet công khai hoặc link xuất CSV của bạn.',
    currentSheetId: 'Mã Sheet ID hiện tại',
    autoSyncToggle: 'Bật Tự Động Đồng Bộ Dữ Liệu',
    syncIntervalLabel: 'Chu Kỳ Tự Động Tải Lại',
    sec10: '10 giây',
    sec30: '30 giây',
    min1: '1 phút',
    min5: '5 phút',
    hour1: '1 giờ',
    hours4: '4 tiếng',
    testConnection: 'Kiểm Tra Kết Nối API',
    saveConfig: 'Lưu Cấu Hình',
    resetDefaultSheet: 'Khôi Phục Link Sheet Gốc',
    syncSuccessMsg: 'Kết nối và cập nhật lịch Boss từ Google Sheet thành công!',
    syncErrorMsg: 'Không thể tải Sheet trực tiếp. Đang hiển thị dữ liệu bộ nhớ đệm / mẫu.',

    // Notification
    soundAlert: 'Cảnh Báo Âm Thanh',
    soundOn: 'Đã Bật Âm Thanh',
    soundOff: 'Đã Tắt Âm Thanh',
    bossSpawnedToast: '🎉 Boss {name} đã xuất hiện tại {map} ({channel})!',
    bossSoonToast: '⚠️ Boss {name} sẽ xuất hiện trong {time}!',
    
    // Common
    close: 'Đóng',
    cancel: 'Hủy',
    save: 'Lưu Thay Đổi',
    confirm: 'Xác Nhận',
    minutes: 'phút',
    hours: 'giờ',
    seconds: 'giây',
    now: 'Vừa xong',
    ago: 'trước',
    none: 'Không có',
    
    // Language & Theme
    langName: 'Tiếng Việt',
    themeDark: 'Giao Diện Tối',
    themeLight: 'Giao Diện Sáng',
  },
  en: {
    appTitle: 'Boss Timer & Schedule Tracker',
    appSubtitle: 'Live Boss spawn timers and schedule dynamically synced with Google Sheets',
    horizontalTable: 'Table View',
    scoreCardView: 'Score Card View',
    syncSheet: 'Sync Sheet',
    syncing: 'Syncing...',
    lastSynced: 'Last synced at',
    sheetConfig: 'Sheet Config',
    addBoss: 'Add New Boss',
    searchPlaceholder: 'Search Boss name...',
    allStatus: 'All Statuses',
    aliveOnly: '🔴 Alive / Spawned',
    soonOnly: '🟡 Spawning Soon (<15m)',
    cooldownOnly: '🔵 Respawning / Cooldown',
    unknownOnly: '⚪ Unknown Time',
    allMaps: 'All Maps',
    allChannels: 'All Channels',
    sortBy: 'Sort By',
    sortNextSpawn: 'Spawn Time (24H)',
    sortLevel: 'Boss Level',
    sortName: 'Boss Name (A-Z)',
    sortCooldown: 'Respawn Cooldown',
    
    // KPI Cards
    kpiTotal: 'Total Bosses',
    kpiAlive: 'Alive / Spawned',
    kpiSoon: 'Spawning Soon (<15m)',
    kpiCooldown: 'In Cooldown',
    
    // Status badges
    statusAlive: 'ALIVE NOW',
    statusSoon: 'SPAWNING SOON',
    statusCooldown: 'RESPAWNING',
    statusUnknown: 'UNKNOWN',

    // Table Headers
    thBoss: 'Boss Name',
    thRate: 'Rate',
    thLevel: 'Level',
    thMap: 'Location / Map',
    thChannel: 'Channel / Sv',
    thCooldown: 'Respawn Cd',
    thLastKill: 'Last Killed',
    thNextSpawn: 'Spawn Time (24H)',
    thSpawnTime: 'Spawn Time (24H)',
    thTimer: 'Countdown',
    thCountdown: 'Countdown',
    thStatus: 'Status',
    thActions: 'Actions',
    
    // Actions
    markKilled: 'Mark Killed',
    viewDetails: 'View Details',
    editBoss: 'Edit',
    deleteBoss: 'Delete',
    resetTimer: 'Reset Timer',
    
    // Boss Card
    respawnProgress: 'Respawn Progress',
    dropItems: 'Item Drops',
    recommendedLevel: 'Rec. Level',
    hpBar: 'Boss HP',

    // Sheet Config Modal
    configTitle: 'Google Sheet API Connection',
    configSubtitle: 'Connect application directly with your Google Sheet schedule file',
    sheetUrlLabel: 'Google Sheet Link (URL)',
    sheetUrlHelp: 'Paste your public Google Sheet URL or exported CSV link.',
    currentSheetId: 'Active Sheet ID',
    autoSyncToggle: 'Enable Automatic Auto-Reload',
    syncIntervalLabel: 'Auto-Reload Frequency',
    sec10: '10 seconds',
    sec30: '30 seconds',
    min1: '1 minute',
    min5: '5 minutes',
    hour1: '1 hour',
    hours4: '4 hours',
    testConnection: 'Test API Connection',
    saveConfig: 'Save Configuration',
    resetDefaultSheet: 'Restore Default Sheet Link',
    syncSuccessMsg: 'Successfully connected and synced Boss schedule from Google Sheet!',
    syncErrorMsg: 'Could not fetch public CSV directly. Using cached schedule data.',

    // Notification
    soundAlert: 'Sound Notification',
    soundOn: 'Audio On',
    soundOff: 'Audio Off',
    bossSpawnedToast: '🎉 Boss {name} HAS SPAWNED at {map} ({channel})!',
    bossSoonToast: '⚠️ Boss {name} spawns in {time}!',
    
    // Common
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save Changes',
    confirm: 'Confirm',
    minutes: 'mins',
    hours: 'hrs',
    seconds: 'secs',
    now: 'Just now',
    ago: 'ago',
    none: 'None',
    
    // Language & Theme
    langName: 'English',
    themeDark: 'Dark Mode',
    themeLight: 'Light Mode',
  }
};

export function getTranslation(lang: Language, key: keyof typeof translations.vi): string {
  return translations[lang][key] || translations.vi[key] || key;
}
