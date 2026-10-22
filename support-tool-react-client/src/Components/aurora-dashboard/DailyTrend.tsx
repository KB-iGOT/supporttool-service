import React, { useMemo } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Grid2,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { DailyChart } from "./DailyChart";
import { ColorSwatch, outlinedCardSx } from "./shared";
import { buildDayCells, formatDateRange, formatDayLabel, formatNumber, formatPercent, getMetricsTone, hasDrafts, isSameDay, parseIsoDate, percentOf, toIsoDate } from "./utils";
import { AuroraMetrics, DailyTrendProps, StatTileProps, MonthTotalsProps, DailyNumbersTableProps } from "./aurora.model";

/* ───────── Month totals ───────── */

const StatTile: React.FC<StatTileProps> = ({ title, value, caption, swatchColor }) => (
  <Box
    sx={{
      bgcolor: "action.hover",
      border: (theme) => `1px solid ${theme.palette.divider}`,
      borderRadius: 2,
      p: 2,
      height: "100%",
      boxSizing: "border-box",
    }}
  >
    <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {swatchColor && <ColorSwatch color={swatchColor} />}
      {title}
    </Typography>
    <Typography variant="h5" fontWeight="bold">
      {formatNumber(value)}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {caption}
    </Typography>
  </Box>
);

const MonthTotals: React.FC<MonthTotalsProps> = ({ metrics, periodLabel }) => {
  const theme = useTheme();
  const { tickets_received: received, drafts_created: drafts, drafts_accepted: accepted, drafts_rejected: rejected } = metrics;

  const tiles: StatTileProps[] = [
    { title: "Total received", value: received, caption: periodLabel, swatchColor: theme.palette.grey[400] },
    {
      title: "Drafts created",
      value: drafts,
      caption: received ? `${percentOf(drafts, received)}% of tickets got a draft` : "—",
    },
    {
      title: "Accepted",
      value: accepted,
      caption: drafts ? `${percentOf(accepted, drafts)}% of drafts` : "—",
      swatchColor: theme.palette.success.main,
    },
    {
      title: "Rejected",
      value: rejected,
      caption: drafts ? `${percentOf(rejected, drafts)}% of drafts` : "—",
      swatchColor: theme.palette.error.light,
    },
  ];

  return (
    <Grid2 container spacing={2}>
      {tiles.map((tile) => (
        <Grid2 key={tile.title} size={{ xs: 6, md: 3 }}>
          <StatTile {...tile} />
        </Grid2>
      ))}
    </Grid2>
  );
};

/* ───────── Daily numbers table ───────── */

const DAILY_COLUMNS = ["Received", "Drafts created", "Accepted", "Rejected", "Success rate"];

const DailyMetricCells: React.FC<{ metrics: AuroraMetrics }> = ({ metrics }) => {
  const tone = getMetricsTone(metrics);
  return (
    <>
      <TableCell align="right">{formatNumber(metrics.tickets_received)}</TableCell>
      <TableCell align="right">{formatNumber(metrics.drafts_created)}</TableCell>
      <TableCell align="right">{formatNumber(metrics.drafts_accepted)}</TableCell>
      <TableCell align="right">{formatNumber(metrics.drafts_rejected)}</TableCell>
      <TableCell align="right" sx={{ color: tone === "default" ? "text.secondary" : `${tone}.main`, fontWeight: 600 }}>
        {hasDrafts(metrics) ? formatPercent(metrics.success_rate) : "—"}
      </TableCell>
    </>
  );
};

/** Collapsible table of the daily numbers, newest day first. */
const DailyNumbersTable: React.FC<DailyNumbersTableProps> = ({ dayCells, monthMetrics, periodLabel, selectedDay, onDaySelect }) => {
  const daysWithData = dayCells.filter((cell) => cell.metrics).reverse();

  return (
    <Accordion disableGutters elevation={0} sx={{ mt: 2, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="subtitle2">Daily numbers</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <TableContainer sx={{ maxHeight: 420 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                {DAILY_COLUMNS.map((column) => (
                  <TableCell key={column} align="right">
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {daysWithData.map((cell) => (
                <TableRow key={toIsoDate(cell.date)} hover selected={isSameDay(cell.date, selectedDay)} onClick={() => onDaySelect(cell.date)} sx={{ cursor: "pointer" }}>
                  <TableCell>{formatDayLabel(cell.date)}</TableCell>
                  <DailyMetricCells metrics={cell.metrics!} />
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow sx={{ "& td": { fontWeight: 700, color: "text.primary", fontSize: "0.875rem" } }}>
                <TableCell>{periodLabel}</TableCell>
                <DailyMetricCells metrics={monthMetrics} />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
};

/* ───────── Day-by-day card ───────── */

export const DailyTrend: React.FC<DailyTrendProps> = ({ overview, selectedWeekIndex, selectedDay, periodLabel, onWeekChange, onDaySelect }) => {
  const dayCells = useMemo(() => buildDayCells(overview), [overview]);
  const selectedWeek = overview.weeks[selectedWeekIndex];

  const handleWeekChange = (_event: React.MouseEvent<HTMLElement>, weekIndex: number | null) => {
    if (weekIndex !== null) {
      onWeekChange(weekIndex);
    }
  };

  return (
    <Card sx={{ ...outlinedCardSx, mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h6">Day by day</Typography>
            <Typography variant="body2" color="text.secondary">
              Select a week, or click a day on the chart to compare it with the month.
            </Typography>
          </Box>
          <ToggleButtonGroup size="small" exclusive color="primary" value={selectedWeekIndex} onChange={handleWeekChange} aria-label="Select week" sx={{ flexWrap: "wrap" }}>
            {overview.weeks.map((week, weekIndex) => (
              <ToggleButton key={week.index} value={weekIndex} disabled={!week.metrics} sx={{ textTransform: "none", flexDirection: "column", lineHeight: 1.2, px: 1.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  Week {week.index}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateRange(parseIsoDate(week.start), parseIsoDate(week.end))}
                  {hasDrafts(week.metrics) ? ` · ${week.metrics.success_rate}%` : ""}
                </Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ mb: 3 }}>
          <MonthTotals metrics={overview.month.metrics} periodLabel={periodLabel} />
        </Box>

        <DailyChart dayCells={dayCells} selectedDay={selectedDay} weekStart={parseIsoDate(selectedWeek.start)} weekEnd={parseIsoDate(selectedWeek.end)} onDaySelect={onDaySelect} />

        <DailyNumbersTable dayCells={dayCells} monthMetrics={overview.month.metrics} periodLabel={periodLabel} selectedDay={selectedDay} onDaySelect={onDaySelect} />
      </CardContent>
    </Card>
  );
};
