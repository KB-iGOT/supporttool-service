import React from "react";
import { Box, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import { ColorSwatch, getDraftColors, hatchedFill } from "./shared";
import { SUCCESS_THRESHOLD, addDays, countDaysInclusive, formatDateRange, formatDayLabel, formatNumber, getMetricsTone, hasDrafts, isSameDay, parseIsoDate, toIsoDate } from "./utils";
import { DailyChartProps, DayCell, DayColumnProps, WeekBandsProps } from "./aurora.model";

/** Heights in px of the chart rows, top to bottom. */
const LAYOUT = { weekBands: 40, volume: 128, gap: 20, rate: 88, dayLabel: 30, axisGutter: 42 };
const VOLUME_TOP = LAYOUT.weekBands;
const VOLUME_BASELINE = VOLUME_TOP + LAYOUT.volume;
const RATE_TOP = VOLUME_BASELINE + LAYOUT.gap;
const RATE_BOTTOM = RATE_TOP + LAYOUT.rate;

const visuallyHiddenSx = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

/** Rounds the busiest day up to a tidy axis maximum. */
const getVolumeScaleMax = (dayCells: DayCell[]) => {
  const busiest = Math.max(1, ...dayCells.map((cell) => (cell.metrics ? Math.max(cell.metrics.tickets_received, cell.metrics.drafts_created) : 0)));
  const step = busiest <= 20 ? 5 : busiest <= 100 ? 10 : busiest <= 200 ? 20 : 50;
  return Math.ceil(busiest / step) * step;
};

/** The rate axis starts at 50% unless a day falls lower, then drops to the nearest 10% below it. */
const getRateFloor = (dayCells: DayCell[]) => {
  const rates = dayCells.filter((cell) => hasDrafts(cell.metrics)).map((cell) => cell.metrics!.success_rate ?? 0);
  if (!rates.length) return 50;
  return Math.min(50, Math.max(0, Math.floor((Math.min(...rates) - 5) / 10) * 10));
};

/** Position of a rate on the rate axis, as a percentage from the bottom. */
const toRatePosition = (rate: number, rateFloor: number) => Math.max(0, Math.min(100, ((rate - rateFloor) / (100 - rateFloor)) * 100));

/** SVG path joining the success rate of consecutive days that have drafts; days without drafts break the line. */
const buildRatePath = (dayCells: DayCell[], rateFloor: number) => {
  let path = "";
  let isDrawing = false;
  dayCells.forEach((cell, dayOffset) => {
    if (hasDrafts(cell.metrics)) {
      const y = 100 - toRatePosition(cell.metrics.success_rate ?? 0, rateFloor);
      path += `${isDrawing ? "L" : "M"}${dayOffset + 0.5} ${y} `;
      isDrawing = true;
    } else {
      isDrawing = false;
    }
  });
  return path;
};

const describeDay = (cell: DayCell) => {
  const metrics = cell.metrics;
  const received = metrics?.tickets_received ?? 0;
  const summary = hasDrafts(metrics) ? `${metrics.drafts_created} drafts, ${metrics.drafts_accepted} accepted, ${metrics.drafts_rejected} rejected, ${metrics.success_rate}% success` : "no drafts";
  return `${formatDayLabel(cell.date)}: ${received} received, ${summary}`;
};

/* ───────── Legend ───────── */

/** Legend for the daily chart; shown in the card header. */
export const DailyChartLegend: React.FC = () => {
  const theme = useTheme();
  const colors = getDraftColors(theme);
  const lineKey = (style: "solid" | "dashed", color: string) => <Box component="span" aria-hidden="true" sx={{ width: 18, borderTop: `2px ${style} ${color}`, display: "inline-block" }} />;
  const items = [
    { label: "Received", key: <ColorSwatch color={colors.received} variant="outline" /> },
    { label: "Accepted", key: <ColorSwatch color={colors.accepted} /> },
    { label: "Rejected", key: <ColorSwatch color={colors.rejected} variant="hatched" /> },
    { label: "Success rate", key: lineKey("solid", theme.palette.text.primary) },
    { label: `${SUCCESS_THRESHOLD}% mark`, key: lineKey("dashed", theme.palette.text.secondary) },
  ];

  return (
    <Box aria-hidden="true" sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 2, rowGap: 0.5 }}>
      {items.map((item) => (
        <Typography key={item.label} variant="body2" color="text.secondary" component="span" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {item.key}
          {item.label}
        </Typography>
      ))}
    </Box>
  );
};

/* ───────── Week bands ───────── */

/** One clickable band per week across the top of the chart, showing the week's success rate. */
const WeekBands: React.FC<WeekBandsProps> = ({ weeks, selectedWeekIndex, onWeekChange }) => {
  const theme = useTheme();

  return (
    <>
      {weeks.map((week, weekIndex) => {
        const weekStart = parseIsoDate(week.start);
        const weekEnd = parseIsoDate(week.end);
        const weekLength = countDaysInclusive(weekStart, weekEnd);
        const isSelected = weekIndex === selectedWeekIndex;
        const isShortWeek = weekLength < 3;
        const tone = getMetricsTone(week.metrics);

        return (
          <Box
            key={week.index}
            component="button"
            type="button"
            aria-pressed={isSelected}
            disabled={!week.metrics}
            onClick={() => onWeekChange(weekIndex)}
            sx={{
              gridColumn: `${weekStart.getDate()} / span ${weekLength}`,
              border: 0,
              borderLeft: weekIndex === 0 ? 0 : `1px solid ${theme.palette.divider}`,
              borderRadius: isSelected ? "8px 8px 0 0" : 0,
              bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.24) : "transparent",
              color: "text.primary",
              font: "inherit",
              textAlign: "left",
              px: "9px",
              pt: "2px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              lineHeight: 1.25,
              overflow: "hidden",
              whiteSpace: "nowrap",
              cursor: "pointer",
              "&:hover:not(:disabled)": { bgcolor: isSelected ? undefined : "action.hover" },
              "&:disabled": { cursor: "default", color: "text.disabled" },
              "&:focus-visible": { outline: `3px solid ${theme.palette.primary.main}`, outlineOffset: -3 },
            }}
          >
            <Box component="b" sx={{ fontSize: ".8rem", fontWeight: 700, color: isSelected ? "primary.main" : week.metrics ? "text.secondary" : "inherit" }}>
              {isShortWeek ? `W${week.index}` : `Week ${week.index}`}
            </Box>
            {!isShortWeek && hasDrafts(week.metrics) && (
              <Box component="span" sx={{ fontSize: ".8rem", fontWeight: 700, color: tone === "default" ? "text.secondary" : `${tone}.main` }}>
                {week.metrics.success_rate}%
              </Box>
            )}
            <Box component="span" sx={visuallyHiddenSx}>
              success rate, {formatDateRange(weekStart, weekEnd)}
            </Box>
          </Box>
        );
      })}
    </>
  );
};

/* ───────── Day column ───────── */

/** One day: received outline with accepted / rejected drafts inside, the success-rate dot, and the date. */
const DayColumn: React.FC<DayColumnProps> = ({ cell, dayOffset, volumeScaleMax, rateFloor, isInSelectedWeek, isSelected, isToday, isFuture, onDaySelect }) => {
  const theme = useTheme();
  const colors = getDraftColors(theme);
  const metrics = cell.metrics;
  const received = metrics?.tickets_received ?? 0;
  const drafts = metrics?.drafts_created ?? 0;
  const tone = getMetricsTone(metrics);
  const heightOf = (value: number) => `${((value / volumeScaleMax) * 100).toFixed(2)}%`;

  const columnBackground = isSelected ? alpha(theme.palette.primary.main, 0.3) : isInSelectedWeek ? alpha(theme.palette.primary.main, 0.1) : "transparent";

  // Arrow keys step through the days, keeping focus on the newly selected column.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const isNext = event.key === "ArrowRight";
    onDaySelect(addDays(cell.date, isNext ? 1 : -1));
    const sibling = (isNext ? event.currentTarget.nextElementSibling : event.currentTarget.previousElementSibling) as HTMLButtonElement | null;
    if (sibling && !sibling.disabled) sibling.focus();
  };

  const column = (
    <Box
      component="button"
      type="button"
      disabled={isFuture}
      aria-pressed={isSelected}
      aria-label={describeDay(cell)}
      onClick={() => metrics && onDaySelect(cell.date)}
      onKeyDown={handleKeyDown}
      sx={{
        border: 0,
        p: "0 1px",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: "6px",
        bgcolor: columnBackground,
        color: "text.primary",
        font: "inherit",
        cursor: metrics ? "pointer" : "default",
        "&:hover:not(:disabled)": { bgcolor: isSelected ? columnBackground : "action.hover" },
        "&:disabled": { cursor: "default" },
        "&:focus-visible": { outline: `3px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
      }}
    >
      {/* Volume: dashed outline for received, stacked rejected (top) and accepted (bottom) drafts inside it */}
      <Box sx={{ height: LAYOUT.volume, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        {(received > 0 || drafts > 0) && (
          <Box sx={{ position: "relative", width: "62%", maxWidth: 22, height: "100%" }}>
            {received > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  left: -2,
                  right: -2,
                  bottom: 0,
                  height: heightOf(received),
                  border: `1.5px dashed ${colors.received}`,
                  borderBottom: 0,
                  borderRadius: "6px 6px 0 0",
                }}
              />
            )}
            {drafts > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: heightOf(drafts),
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px",
                  borderRadius: "5px 5px 0 0",
                  overflow: "hidden",
                }}
              >
                <Box sx={{ flex: metrics!.drafts_rejected, background: hatchedFill(colors.rejected) }} />
                <Box sx={{ flex: metrics!.drafts_accepted, bgcolor: colors.accepted }} />
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Success-rate dot */}
      <Box sx={{ position: "relative", height: LAYOUT.rate, mt: `${LAYOUT.gap}px`, width: "100%" }}>
        {hasDrafts(metrics) && (
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              bottom: `${toRatePosition(metrics.success_rate ?? 0, rateFloor).toFixed(1)}%`,
              width: isSelected ? 12 : 8,
              height: isSelected ? 12 : 8,
              borderRadius: "50%",
              bgcolor: tone === "default" ? "text.secondary" : `${tone}.main`,
              transform: "translate(-50%, 50%)",
              boxShadow: `0 0 0 2px ${columnBackground === "transparent" ? theme.palette.background.paper : columnBackground}`,
            }}
          />
        )}
      </Box>

      {/* Date; on small screens only every 5th day and the selected day are labelled */}
      <Box
        aria-hidden="true"
        sx={{
          height: LAYOUT.dayLabel,
          width: "100%",
          pt: "9px",
          display: "flex",
          justifyContent: "center",
          whiteSpace: "nowrap",
          fontSize: ".78rem",
          fontWeight: isSelected || isToday ? 700 : 400,
          color: isSelected || isToday ? "text.primary" : isInSelectedWeek ? "text.secondary" : "text.disabled",
          visibility: { xs: dayOffset % 5 === 0 || isSelected ? "visible" : "hidden", sm: "visible" },
        }}
      >
        {cell.date.getDate()}
      </Box>
    </Box>
  );

  if (isFuture || !metrics) return column;

  return (
    <Tooltip
      placement="top"
      title={
        <Box sx={{ lineHeight: 1.5 }}>
          <b>{formatDayLabel(cell.date)}</b>
          <br />
          {formatNumber(received)} tickets received
          <br />
          {hasDrafts(metrics) ? (
            <>
              {formatNumber(drafts)} drafts created
              <br />
              {formatNumber(metrics.drafts_accepted)} accepted, {formatNumber(metrics.drafts_rejected)} rejected
              <br />
              <b>{metrics.success_rate}% success</b>
            </>
          ) : (
            "No drafts"
          )}
        </Box>
      }
    >
      {column}
    </Tooltip>
  );
};

/* ───────── Chart ───────── */

/**
 * Day-by-day chart, matching the original Aurora dashboard: week bands on top, one column per
 * day (received outline with accepted / rejected drafts inside) and a success-rate strip below.
 * Every week band and day is a button, so the chart works with the keyboard and screen readers.
 */
export const DailyChart: React.FC<DailyChartProps> = ({ dayCells, weeks, selectedWeekIndex, selectedDay, today, onDaySelect, onWeekChange }) => {
  const theme = useTheme();
  const dayCount = dayCells.length;
  const selectedWeek = weeks[selectedWeekIndex];
  const weekStart = parseIsoDate(selectedWeek.start);
  const weekEnd = parseIsoDate(selectedWeek.end);

  const volumeScaleMax = getVolumeScaleMax(dayCells);
  const rateFloor = getRateFloor(dayCells);
  const showTargetLine = rateFloor < SUCCESS_THRESHOLD;
  const targetY = 100 - toRatePosition(SUCCESS_THRESHOLD, rateFloor);

  const axisLabels = [
    { label: String(volumeScaleMax), top: VOLUME_TOP + 6 },
    { label: "0", top: VOLUME_BASELINE },
    { label: "100%", top: RATE_TOP },
    ...(showTargetLine ? [{ label: `${SUCCESS_THRESHOLD}%`, top: RATE_TOP + (targetY / 100) * LAYOUT.rate }] : []),
    { label: `${rateFloor}%`, top: RATE_BOTTOM },
  ];
  const gridLines = [
    { top: VOLUME_TOP, isBaseline: false },
    { top: VOLUME_TOP + LAYOUT.volume / 2, isBaseline: false },
    { top: VOLUME_BASELINE, isBaseline: true },
    { top: RATE_TOP, isBaseline: false },
    { top: RATE_BOTTOM, isBaseline: true },
  ];
  const dayGridSx = { display: "grid", gridTemplateColumns: `repeat(${dayCount}, 1fr)`, position: "relative", zIndex: 1 } as const;

  return (
    <Box
      role="group"
      aria-label="Daily drafts and success rate, one button per day"
      sx={{ display: "grid", gridTemplateColumns: { xs: "36px 1fr", sm: `${LAYOUT.axisGutter}px 1fr` }, pt: 2, pb: 0.5 }}
    >
      {/* Axis labels */}
      <Box aria-hidden="true" sx={{ position: "relative" }}>
        {axisLabels.map((axisLabel) => (
          <Box
            key={axisLabel.label}
            component="span"
            sx={{
              position: "absolute",
              right: 8,
              top: axisLabel.top,
              transform: "translateY(-50%)",
              fontSize: ".75rem",
              color: "text.secondary",
              whiteSpace: "nowrap",
            }}
          >
            {axisLabel.label}
          </Box>
        ))}
      </Box>

      <Box sx={{ position: "relative", minWidth: 0 }}>
        {gridLines.map((line) => (
          <Box key={line.top} aria-hidden="true" sx={{ position: "absolute", left: 0, right: 0, top: line.top, height: "1px", bgcolor: line.isBaseline ? "text.disabled" : "divider" }} />
        ))}

        <Box sx={{ ...dayGridSx, height: LAYOUT.weekBands }}>
          <WeekBands weeks={weeks} selectedWeekIndex={selectedWeekIndex} onWeekChange={onWeekChange} />
        </Box>

        {/* Success-rate line and the 75% mark, drawn over the day columns */}
        <Box
          component="svg"
          aria-hidden="true"
          viewBox={`0 0 ${dayCount} 100`}
          preserveAspectRatio="none"
          sx={{ position: "absolute", left: 0, width: "100%", top: RATE_TOP, height: LAYOUT.rate, zIndex: 2, pointerEvents: "none", overflow: "visible" }}
        >
          {showTargetLine && <line x1={0} x2={dayCount} y1={targetY} y2={targetY} stroke={theme.palette.text.secondary} strokeWidth={1.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />}
          <path d={buildRatePath(dayCells, rateFloor)} fill="none" stroke={theme.palette.text.primary} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </Box>

        <Box sx={dayGridSx}>
          {dayCells.map((cell, dayOffset) => (
            <DayColumn
              key={toIsoDate(cell.date)}
              cell={cell}
              dayOffset={dayOffset}
              volumeScaleMax={volumeScaleMax}
              rateFloor={rateFloor}
              isInSelectedWeek={cell.date >= weekStart && cell.date <= weekEnd}
              isSelected={isSameDay(cell.date, selectedDay)}
              isToday={isSameDay(cell.date, today)}
              isFuture={cell.date > today}
              onDaySelect={onDaySelect}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};
