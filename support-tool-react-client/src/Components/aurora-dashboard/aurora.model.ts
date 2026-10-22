import { ReactNode } from "react";

/* ───────── API response and request types ───────── */

export interface AuroraMetrics {
  tickets_received: number;
  drafts_created: number;
  drafts_accepted: number;
  drafts_rejected: number;
  success_rate: number | null;
  draft_coverage: number | null;
}

export interface AuroraCategory {
  id: string;
  name: string;
  metrics: AuroraMetrics;
  subcategories?: AuroraCategory[];
}

export interface AuroraPeriod {
  metrics: AuroraMetrics;
  categories: AuroraCategory[];
}

export interface AuroraWeek {
  index: number;
  start: string;
  end: string;
  through: string;
  status: "complete" | "in_progress" | "upcoming";
  metrics: AuroraMetrics | null;
  categories: AuroraCategory[];
}

export interface AuroraOverview {
  meta: {
    generated_at: string;
    timezone: string;
    today: string;
    week_start: string;
    months: { earliest: string; latest: string };
  };
  selection: { month: string; date: string; week_index: number };
  month: AuroraPeriod & {
    id: string;
    start: string;
    end: string;
    through: string;
    is_complete: boolean;
  };
  previous_month: { id: string; metrics: AuroraMetrics };
  weeks: AuroraWeek[];
  daily: { date: string; metrics: AuroraMetrics }[];
  day: AuroraPeriod & { date: string; is_today: boolean };
}

export interface AuroraOverviewParams {
  month?: string;
  date?: string;
  week_index?: number;
}

/* ───────── Shared dashboard types ───────── */

export type SuccessTone = "success" | "warning" | "error" | "default";

export interface MonthOption {
  value: string;
  label: string;
}

/** One calendar day of the selected month; metrics is null for days with no data yet. */
export interface DayCell {
  date: Date;
  metrics: AuroraMetrics | null;
}

/* ───────── useAuroraOverview ───────── */

export interface LoadOptions {
  /** Keep the current data on screen while loading, instead of the full-page loader. */
  keepCurrentData?: boolean;
}

/* ───────── Theme ───────── */

export type ThemeMode = "light" | "dark";

export interface ThemeModeToggleProps {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

/* ───────── Shared components ───────── */

/** solid: accepted; outline: received (dashed); hatched: rejected. */
export type SwatchVariant = "solid" | "outline" | "hatched";

export interface ColorSwatchProps {
  color: string;
  variant?: SwatchVariant;
}

export interface StepButtonProps {
  direction: "previous" | "next";
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

/* ───────── Page (index.tsx) ───────── */

export interface DashboardContentProps {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
}

export interface MonthPickerProps {
  /** Available months, newest first. */
  options: MonthOption[];
  selectedMonth: string;
  latestMonth: string;
  disabled?: boolean;
  onMonthChange: (month: string) => void;
  onCurrentMonth: () => void;
}

/* ───────── SummaryCard ───────── */

export interface Comparison {
  metrics: AuroraMetrics | null;
  label: string;
}

export interface SummaryCardProps {
  kind: string;
  title: string;
  note?: string;
  metrics: AuroraMetrics | null;
  comparison?: Comparison;
  actions?: ReactNode;
  isLarge?: boolean;
}

export interface SuccessDeltaChipProps {
  metrics: AuroraMetrics;
  comparison: Comparison;
}

/* ───────── DailyTrend ───────── */

export interface DailyTrendProps {
  overview: AuroraOverview;
  selectedWeekIndex: number;
  selectedDay: Date;
  periodLabel: string;
  onWeekChange: (weekIndex: number) => void;
  onDaySelect: (day: Date) => void;
}

export interface StatTileProps {
  title: string;
  value: number;
  caption: string;
  swatchColor?: string;
  swatchVariant?: SwatchVariant;
}

export interface MonthTotalsProps {
  metrics: AuroraMetrics;
  periodLabel: string;
}

export interface DailyNumbersTableProps {
  dayCells: DayCell[];
  monthMetrics: AuroraMetrics;
  periodLabel: string;
  selectedDay: Date;
  onDaySelect: (day: Date) => void;
}

/* ───────── DailyChart ───────── */

export interface DailyChartProps {
  dayCells: DayCell[];
  weeks: AuroraWeek[];
  selectedWeekIndex: number;
  selectedDay: Date;
  today: Date;
  onDaySelect: (day: Date) => void;
  onWeekChange: (weekIndex: number) => void;
}

export interface WeekBandsProps {
  weeks: AuroraWeek[];
  selectedWeekIndex: number;
  onWeekChange: (weekIndex: number) => void;
}

export interface DayColumnProps {
  cell: DayCell;
  /** Position in the month, 0-based; every 5th label stays visible on small screens. */
  dayOffset: number;
  /** Ticket count at the top of the volume axis. */
  volumeScaleMax: number;
  /** Lowest success rate on the rate axis (the top is always 100%). */
  rateFloor: number;
  isInSelectedWeek: boolean;
  isSelected: boolean;
  isToday: boolean;
  isFuture: boolean;
  onDaySelect: (day: Date) => void;
}

/* ───────── CategoryBreakdown ───────── */

export type PeriodScope = "month" | "week" | "day";

export type SortOrder = "mostDrafts" | "lowestSuccess";

export interface CategoryBreakdownProps {
  overview: AuroraOverview;
  selectedWeekIndex: number;
}

export interface DraftSplitBarProps {
  metrics: AuroraMetrics;
  maxDrafts: number;
  isThin?: boolean;
}

export interface CategoryRowsProps {
  category: AuroraCategory;
  isExpanded: boolean;
  maxCategoryDrafts: number;
  maxSubcategoryDrafts: number;
  onToggle: (categoryId: string) => void;
}
