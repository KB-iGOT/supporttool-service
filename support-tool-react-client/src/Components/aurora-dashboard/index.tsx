import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Grid2, LinearProgress, MenuItem, SxProps, TextField, Theme, ThemeProvider, Typography } from "@mui/material";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { DailyTrend } from "./DailyTrend";
import { SummaryCard } from "./SummaryCard";
import { StepButton, ThemeModeToggle, noTextTransformSx, outlinedCardSx, useDashboardTheme } from "./shared";
import { useAuroraOverview } from "./useAuroraOverview";
import { addDays, countDaysInclusive, formatDateRange, formatDayLabel, formatMonthLong, formatMonthShort, getMonthOptions, getPreviousMonth, isSameDay, parseIsoDate, toIsoDate } from "./utils";
import { DashboardContentProps, MonthPickerProps, ThemeMode } from "./aurora.model";

/** Bordered strip holding the page title, month picker and theme switch. */
const headerSx: SxProps<Theme> = {
  ...outlinedCardSx,
  bgcolor: "background.paper",
  px: 3,
  py: 2,
  mb: 3,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: 2,
};

/** In dark mode the dashboard gets its own dark page background; light mode keeps the app's background. */
const getPageSx = (themeMode: ThemeMode): SxProps<Theme> => ({
  p: 3,
  borderRadius: 2,
  color: "text.primary",
  bgcolor: themeMode === "dark" ? "background.default" : "transparent",
});

const PageTitle: React.FC = () => (
  <Box>
    <Typography variant="h4" component="h1" fontWeight="bold">
      Aurora AI Dashboard
    </Typography>
    <Typography color="text.secondary">AI-drafted replies for Zoho Desk tickets</Typography>
  </Box>
);

const MonthPicker: React.FC<MonthPickerProps> = ({ options, selectedMonth, latestMonth, disabled = false, onMonthChange, onCurrentMonth }) => {
  const selectedIndex = options.findIndex((option) => option.value === selectedMonth);
  const olderMonth = options[selectedIndex + 1];
  const newerMonth = selectedIndex > 0 ? options[selectedIndex - 1] : undefined;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "flex-start", md: "flex-end" }, gap: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <StepButton direction="previous" label="Previous month" disabled={disabled || !olderMonth} onClick={() => olderMonth && onMonthChange(olderMonth.value)} />
        <TextField select size="small" label="Month" value={selectedMonth} disabled={disabled} onChange={(event) => onMonthChange(event.target.value)} sx={{ minWidth: 200 }}>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <StepButton direction="next" label="Next month" disabled={disabled || !newerMonth} onClick={() => newerMonth && onMonthChange(newerMonth.value)} />
        <Button variant="outlined" disabled={disabled || selectedMonth === latestMonth} onClick={onCurrentMonth} sx={noTextTransformSx}>
          This month
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Weeks run Monday to Sunday. Times in IST.
      </Typography>
    </Box>
  );
};

const DashboardContent: React.FC<DashboardContentProps> = ({ themeMode, onThemeModeChange }) => {
  const { overview, isLoading, isRefreshing, error, loadOverview, retry, clearError } = useAuroraOverview();
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  // Every response says which week holds the selected day; follow it.
  useEffect(() => {
    if (overview) {
      const selectedDayWeekIndex = overview.selection.week_index - 1;
      setSelectedWeekIndex(Math.min(Math.max(selectedDayWeekIndex, 0), overview.weeks.length - 1));
    }
  }, [overview]);

  const monthOptions = useMemo(() => (overview ? getMonthOptions(overview.meta.months.earliest, overview.meta.months.latest) : []), [overview]);

  if (!overview) {
    return (
      <Box sx={getPageSx(themeMode)}>
        <Box sx={headerSx}>
          <PageTitle />
          <ThemeModeToggle mode={themeMode} onChange={onThemeModeChange} />
        </Box>
        {isLoading ? (
          <LinearProgress />
        ) : (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={retry}>
                Retry
              </Button>
            }
          >
            {error || "Failed to load the Aurora AI dashboard."}
          </Alert>
        )}
      </Box>
    );
  }

  const { month, day, weeks, meta } = overview;
  const isBusy = isLoading || isRefreshing;
  const today = parseIsoDate(meta.today);
  const selectedDay = parseIsoDate(day.date);
  const monthStart = parseIsoDate(month.start);
  const monthLastDataDay = parseIsoDate(month.through);
  const monthPeriodLabel = month.is_complete ? "Full month" : "Month to date";

  // The index can briefly outrun a new month's weeks until the effect above catches up.
  const weekIndex = Math.min(selectedWeekIndex, weeks.length - 1);
  const selectedWeek = weeks[weekIndex];
  const weekStart = parseIsoDate(selectedWeek.start);
  const weekEnd = parseIsoDate(selectedWeek.end);
  const weekLength = countDaysInclusive(weekStart, weekEnd);
  const startedWeekCount = weeks.filter((week) => week.status !== "upcoming").length;
  const weekNote = selectedWeek.status === "in_progress" ? "In progress" : weekLength < 7 ? `${weekLength} days` : undefined;

  const showMonth = (monthId: string) => loadOverview({ month: monthId });
  const showCurrentMonth = () => loadOverview({});
  const showDay = (date: Date) => {
    if (date < monthStart || date > monthLastDataDay) return;
    loadOverview({ month: month.id, date: toIsoDate(date) }, { keepCurrentData: true });
  };

  const weekActions = (
    <>
      <StepButton direction="previous" label="Previous week" disabled={weekIndex === 0} onClick={() => setSelectedWeekIndex(weekIndex - 1)} />
      <StepButton direction="next" label="Next week" disabled={weekIndex >= startedWeekCount - 1} onClick={() => setSelectedWeekIndex(weekIndex + 1)} />
    </>
  );

  const dayActions = (
    <>
      {!month.is_complete && !day.is_today && (
        <Button size="small" variant="outlined" disabled={isBusy} onClick={() => showDay(today)} sx={{ ...noTextTransformSx, minWidth: 0 }}>
          Today
        </Button>
      )}
      <StepButton direction="previous" label="Previous day" disabled={isBusy || isSameDay(selectedDay, monthStart)} onClick={() => showDay(addDays(selectedDay, -1))} />
      <StepButton direction="next" label="Next day" disabled={isBusy || isSameDay(selectedDay, monthLastDataDay)} onClick={() => showDay(addDays(selectedDay, 1))} />
    </>
  );

  return (
    <Box sx={getPageSx(themeMode)}>
      <Box sx={headerSx}>
        <PageTitle />
        <Box sx={{ display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
          <MonthPicker options={monthOptions} selectedMonth={month.id} latestMonth={meta.months.latest} disabled={isBusy} onMonthChange={showMonth} onCurrentMonth={showCurrentMonth} />
          <ThemeModeToggle mode={themeMode} onChange={onThemeModeChange} />
        </Box>
      </Box>

      {isBusy && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Box sx={{ opacity: isBusy ? 0.6 : 1, transition: "opacity .2s" }}>
        <Grid2 container spacing={3} columns={10} sx={{ mb: 3 }}>
          <Grid2 size={{ xs: 10, lg: 4 }}>
            <SummaryCard
              isLarge
              kind="Month"
              title={formatMonthLong(monthStart)}
              note={monthPeriodLabel}
              metrics={month.metrics}
              comparison={{ metrics: overview.previous_month.metrics, label: formatMonthShort(getPreviousMonth(monthStart)) }}
            />
          </Grid2>
          <Grid2 size={{ xs: 10, md: 5, lg: 3 }}>
            <SummaryCard
              kind={`Week ${selectedWeek.index}`}
              title={formatDateRange(weekStart, weekEnd)}
              note={weekNote}
              metrics={selectedWeek.metrics}
              comparison={{ metrics: month.metrics, label: "month" }}
              actions={weekActions}
            />
          </Grid2>
          <Grid2 size={{ xs: 10, md: 5, lg: 3 }}>
            <SummaryCard
              kind={day.is_today ? "Today" : "Day"}
              title={formatDayLabel(selectedDay)}
              note={day.is_today ? "In progress" : undefined}
              metrics={day.metrics}
              comparison={{ metrics: month.metrics, label: "month" }}
              actions={dayActions}
            />
          </Grid2>
        </Grid2>

        <DailyTrend overview={overview} selectedWeekIndex={weekIndex} selectedDay={selectedDay} periodLabel={monthPeriodLabel} onWeekChange={setSelectedWeekIndex} onDaySelect={showDay} />

        {/* Keyed by month so sorting, period and expanded rows reset on a new month. */}
        <CategoryBreakdown key={month.id} overview={overview} selectedWeekIndex={weekIndex} />
      </Box>
    </Box>
  );
};

/** The dashboard has its own light/dark theme, so switching it leaves the rest of the portal unchanged. */
export const AuroraDashboard: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useDashboardTheme();

  return (
    <ThemeProvider theme={theme}>
      <DashboardContent themeMode={themeMode} onThemeModeChange={setThemeMode} />
    </ThemeProvider>
  );
};
