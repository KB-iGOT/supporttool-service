import { AuroraMetrics, AuroraOverview, SuccessTone, MonthOption, DayCell } from "./aurora.model";

export const SUCCESS_THRESHOLD = 75;
const WARNING_THRESHOLD = 50;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const padTwoDigits = (value: number) => String(value).padStart(2, "0");

/* ───────── Dates ───────── */

/** Parses "YYYY-MM-DD" or "YYYY-MM" as a local date (no timezone shift). */
export const parseIsoDate = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day || 1);
};

export const toIsoDate = (date: Date): string => `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}`;

export const toYearMonth = (date: Date): string => `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}`;

export const addDays = (date: Date, days: number): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const isSameDay = (first: Date, second: Date): boolean => toIsoDate(first) === toIsoDate(second);

/** Number of days in the range, counting both ends. */
export const countDaysInclusive = (start: Date, end: Date): number => Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

export const getPreviousMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() - 1, 1);

export const formatMonthShort = (date: Date): string => date.toLocaleDateString("en-GB", { month: "short" });

export const formatMonthLong = (date: Date): string => date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export const formatDayLabel = (date: Date): string => date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

export const formatShortDate = (date: Date): string => `${date.getDate()} ${formatMonthShort(date)}`;

export const formatDateRange = (start: Date, end: Date): string => (isSameDay(start, end) ? formatShortDate(start) : `${start.getDate()}–${end.getDate()} ${formatMonthShort(end)}`);

/** Lists the available months, newest first. Both bounds are "YYYY-MM". */
export const getMonthOptions = (earliest: string, latest: string): MonthOption[] => {
  const options: MonthOption[] = [];
  const firstMonth = parseIsoDate(earliest);
  for (let month = parseIsoDate(latest); month >= firstMonth; month = getPreviousMonth(month)) {
    options.push({ value: toYearMonth(month), label: formatMonthLong(month) });
  }
  return options;
};

/* ───────── Numbers ───────── */

export const formatNumber = (value: number | null | undefined): string => (value == null ? "—" : Number(value).toLocaleString("en-IN"));

export const formatPercent = (value: number | null | undefined): string => (value == null ? "—" : `${value}%`);

export const percentOf = (part: number, total: number): number => (total ? Math.round((part / total) * 100) : 0);

/* ───────── Metrics ───────── */

export const hasDrafts = (metrics: AuroraMetrics | null | undefined): metrics is AuroraMetrics => !!metrics && metrics.drafts_created > 0;

export const getSuccessTone = (successRate: number | null | undefined): SuccessTone => {
  if (successRate == null) return "default";
  if (successRate >= SUCCESS_THRESHOLD) return "success";
  if (successRate >= WARNING_THRESHOLD) return "warning";
  return "error";
};

/** Success tone for a period; periods without drafts are neutral. */
export const getMetricsTone = (metrics: AuroraMetrics | null | undefined): SuccessTone => (hasDrafts(metrics) ? getSuccessTone(metrics.success_rate) : "default");

/** "profile_and_user_management" -> "Profile and user management" */
export const humanizeLabel = (label: string): string => {
  const text = label.replace(/_/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Builds one cell per calendar day of the overview's month, in date order. */
export const buildDayCells = (overview: AuroraOverview): DayCell[] => {
  const metricsByDate = new Map(overview.daily.map((entry) => [entry.date, entry.metrics]));
  const monthStart = parseIsoDate(overview.month.start);
  const daysInMonth = parseIsoDate(overview.month.end).getDate();

  return Array.from({ length: daysInMonth }, (_, offset) => {
    const date = addDays(monthStart, offset);
    return { date, metrics: metricsByDate.get(toIsoDate(date)) ?? null };
  });
};
