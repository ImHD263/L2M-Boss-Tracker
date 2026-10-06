/**
 * Định dạng thời gian theo chuẩn 24 Giờ (24-Hour Format: HH:mm:ss hoặc HH:mm)
 * Đảm bảo luôn luôn sử dụng 24h (hour12: false), không bao giờ hiển thị AM/PM.
 */

export function formatTime24h(
  dateInput: Date | string | number | null | undefined,
  options: {
    showSeconds?: boolean;
    emptyFallback?: string;
  } = {}
): string {
  const { showSeconds = true, emptyFallback = '--:--:--' } = options;

  if (!dateInput) return emptyFallback;

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return emptyFallback;

  const pad = (n: number) => String(n).padStart(2, '0');
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  if (showSeconds) {
    const seconds = pad(date.getSeconds());
    return `${hours}:${minutes}:${seconds}`;
  }

  return `${hours}:${minutes}`;
}

export function formatDateTime24h(
  dateInput: Date | string | number | null | undefined,
  options: {
    showSeconds?: boolean;
    emptyFallback?: string;
  } = {}
): string {
  const { showSeconds = true, emptyFallback = '--:--:--' } = options;

  if (!dateInput) return emptyFallback;

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return emptyFallback;

  const pad = (n: number) => String(n).padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();

  const timeStr = formatTime24h(date, { showSeconds, emptyFallback });
  return `${timeStr} ${d}/${m}/${y}`;
}
