import React from "react";
import { Box, alpha, useTheme } from "@mui/material";
import {
  Chart as ChartJS,
  BarController,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  ChartData,
  ChartOptions,
  LegendItem,
  PointStyle,
  ScriptableContext,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { SUCCESS_THRESHOLD, formatDayLabel, formatNumber, getMetricsTone, hasDrafts, isSameDay } from "./utils";
import { DayCell, MixedChartType, DailyChartProps } from "./aurora.model";

ChartJS.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip);

const SUCCESS_RATE_LABEL = "Success rate";
const TARGET_LABEL = `${SUCCESS_THRESHOLD}% mark`;
const FADED_OPACITY = 0.35;

/**
 * Bars show tickets received and drafts (accepted + rejected) per day; the line shows
 * the daily success rate. Days outside the selected week are faded; clicking a day selects it.
 */
export const DailyChart: React.FC<DailyChartProps> = ({ dayCells, selectedDay, weekStart, weekEnd, onDaySelect }) => {
  const theme = useTheme();
  const colors = {
    received: theme.palette.grey[400],
    accepted: theme.palette.success.main,
    rejected: theme.palette.error.light,
    successRate: theme.palette.primary.main,
    target: theme.palette.text.secondary,
  };
  // Chart.js draws on a canvas, so axis text and grid lines need the theme colours passed in explicitly.
  const axisTextColor = theme.palette.text.secondary;
  const gridLineColor = theme.palette.divider;

  // Chart.js would take legend colours from the first day (often faded or toned), so fix them here.
  const legendStyles: Record<string, { color: string; pointStyle: PointStyle; lineDash?: number[] }> = {
    [SUCCESS_RATE_LABEL]: { color: colors.successRate, pointStyle: "circle" },
    [TARGET_LABEL]: { color: colors.target, pointStyle: "line", lineDash: [5, 4] },
    Received: { color: colors.received, pointStyle: "rectRounded" },
    Accepted: { color: colors.accepted, pointStyle: "rectRounded" },
    Rejected: { color: colors.rejected, pointStyle: "rectRounded" },
  };

  const generateLegendLabels = (chart: ChartJS): LegendItem[] =>
    ChartJS.defaults.plugins.legend.labels.generateLabels(chart).map((item) => {
      const style = legendStyles[item.text];
      if (!style) return item;
      return {
        ...item,
        fillStyle: style.color,
        strokeStyle: style.color,
        lineWidth: style.pointStyle === "line" ? 2 : 0,
        lineDash: style.lineDash,
        pointStyle: style.pointStyle,
      };
    });

  const isInSelectedWeek = (index: number) => dayCells[index].date >= weekStart && dayCells[index].date <= weekEnd;
  const isSelectedDay = (index: number) => isSameDay(dayCells[index].date, selectedDay);

  const barFill = (color: string) => (context: ScriptableContext<"bar">) => (isInSelectedWeek(context.dataIndex) ? color : alpha(color, FADED_OPACITY));
  const barOutline = (context: ScriptableContext<"bar">) => (isSelectedDay(context.dataIndex) ? theme.palette.text.primary : "transparent");

  const pointColor = (cell: DayCell) => {
    const tone = getMetricsTone(cell.metrics);
    return tone === "default" ? colors.successRate : theme.palette[tone].main;
  };

  const barDataset = (label: string, color: string, stack: string, values: (number | null)[]) => ({
    type: "bar" as const,
    label,
    data: values,
    stack,
    backgroundColor: barFill(color),
    borderColor: barOutline,
    borderWidth: 2,
    borderRadius: 3,
    order: 2,
  });

  const chartData: ChartData<MixedChartType, (number | null)[], string> = {
    labels: dayCells.map((cell) => String(cell.date.getDate())),
    datasets: [
      {
        type: "line",
        label: SUCCESS_RATE_LABEL,
        data: dayCells.map((cell) => (hasDrafts(cell.metrics) ? cell.metrics.success_rate : null)),
        yAxisID: "successRate",
        borderColor: colors.successRate,
        borderWidth: 2,
        pointRadius: dayCells.map((_, index) => (isSelectedDay(index) ? 6 : 4)),
        pointBackgroundColor: dayCells.map(pointColor),
        pointBorderColor: theme.palette.background.paper,
        spanGaps: false,
        tension: 0.25,
        order: 0,
      },
      {
        type: "line",
        label: TARGET_LABEL,
        data: dayCells.map(() => SUCCESS_THRESHOLD),
        yAxisID: "successRate",
        borderColor: colors.target,
        borderWidth: 1.5,
        borderDash: [5, 4],
        pointRadius: 0,
        pointHitRadius: 0,
        order: 1,
      },
      barDataset(
        "Received",
        colors.received,
        "received",
        dayCells.map((cell) => cell.metrics?.tickets_received ?? null),
      ),
      barDataset(
        "Accepted",
        colors.accepted,
        "drafts",
        dayCells.map((cell) => cell.metrics?.drafts_accepted ?? null),
      ),
      barDataset(
        "Rejected",
        colors.rejected,
        "drafts",
        dayCells.map((cell) => cell.metrics?.drafts_rejected ?? null),
      ),
    ],
  };

  const chartOptions: ChartOptions<MixedChartType> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    onClick: (_event, elements) => {
      const clickedCell = elements.length ? dayCells[elements[0].index] : undefined;
      if (clickedCell?.metrics) {
        onDaySelect(clickedCell.date);
      }
    },
    onHover: (event, elements) => {
      const canvas = event.native?.target as HTMLElement | undefined;
      if (canvas) {
        canvas.style.cursor = elements.length ? "pointer" : "default";
      }
    },
    plugins: {
      legend: {
        position: "top",
        labels: { usePointStyle: true, boxWidth: 8, padding: 16, color: axisTextColor, generateLabels: generateLegendLabels },
      },
      tooltip: {
        filter: (item) => item.dataset.label !== TARGET_LABEL && item.raw != null,
        callbacks: {
          title: (items) => (items.length ? formatDayLabel(dayCells[items[0].dataIndex].date) : ""),
          label: (item) => (item.dataset.label === SUCCESS_RATE_LABEL ? ` ${SUCCESS_RATE_LABEL}: ${item.raw}%` : ` ${item.dataset.label}: ${formatNumber(item.raw as number)}`),
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        border: { color: gridLineColor },
        ticks: { color: axisTextColor },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: gridLineColor },
        border: { color: gridLineColor },
        title: { display: true, text: "Tickets", color: axisTextColor },
        ticks: { precision: 0, color: axisTextColor },
      },
      successRate: {
        position: "right",
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false },
        border: { color: gridLineColor },
        title: { display: true, text: SUCCESS_RATE_LABEL, color: axisTextColor },
        ticks: { callback: (value) => `${value}%`, color: axisTextColor },
      },
    },
  };

  return (
    <Box sx={{ position: "relative", height: 340 }}>
      <Chart type="bar" data={chartData} options={chartOptions} />
    </Box>
  );
};
