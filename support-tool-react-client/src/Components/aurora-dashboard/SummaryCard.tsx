import React from "react";
import { Box, Card, CardContent, Chip, Divider, Typography, useTheme } from "@mui/material";
import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material";
import { Chart as ChartJS, ArcElement, Tooltip, ChartData, ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { ColorSwatch, getDraftColors, outlinedCardSx } from "./shared";
import { formatNumber, getMetricsTone, hasDrafts, pendingOf } from "./utils";
import { SummaryCardProps, SuccessDeltaChipProps } from "./aurora.model";

ChartJS.register(ArcElement, Tooltip);

/** Shows how far this period's success rate is above or below the comparison period. */
const SuccessDeltaChip: React.FC<SuccessDeltaChipProps> = ({ metrics, comparison }) => {
  if (metrics.success_rate == null || !hasDrafts(comparison.metrics) || comparison.metrics.success_rate == null) {
    return null;
  }

  const delta = Math.round((metrics.success_rate - comparison.metrics.success_rate) * 10) / 10;
  if (delta === 0) {
    return <Chip size="small" label={`Same as ${comparison.label}`} sx={{ alignSelf: "flex-start" }} />;
  }

  const isUp = delta > 0;
  return (
    <Chip
      size="small"
      variant="outlined"
      color={isUp ? "success" : "error"}
      icon={isUp ? <ArrowDropUp /> : <ArrowDropDown />}
      label={`${Math.abs(delta)} pts vs ${comparison.label}`}
      sx={{ alignSelf: "flex-start" }}
    />
  );
};

export const SummaryCard: React.FC<SummaryCardProps> = ({ kind, title, note, metrics, comparison, actions, isLarge = false }) => {
  const theme = useTheme();
  const ringSize = isLarge ? 168 : 124;
  const valueVariant = isLarge ? "h4" : "h5";
  const tone = getMetricsTone(metrics);
  const toneColor = tone === "default" ? theme.palette.text.secondary : theme.palette[tone].main;
  const colors = getDraftColors(theme);
  const pending = pendingOf(metrics);
  const ringSegments = hasDrafts(metrics)
    ? [
        { label: "Accepted", value: metrics.drafts_accepted, color: colors.accepted },
        { label: "Rejected", value: metrics.drafts_rejected, color: colors.rejected },
        { label: "Pending", value: pending, color: colors.pending },
      ].filter((segment) => segment.value > 0)
    : [];

  const ringData: ChartData<"doughnut"> = ringSegments.length
    ? {
        labels: ringSegments.map((segment) => segment.label),
        datasets: [
          {
            data: ringSegments.map((segment) => segment.value),
            backgroundColor: ringSegments.map((segment) => segment.color),
            borderColor: theme.palette.background.paper,
            // Gaps between segments only when there is more than one.
            borderWidth: ringSegments.length > 1 ? 2 : 0,
          },
        ],
      }
    : {
        labels: ["No drafts"],
        datasets: [{ data: [1], backgroundColor: [theme.palette.action.disabledBackground], borderWidth: 0 }],
      };

  const ringOptions: ChartOptions<"doughnut"> = {
    cutout: "74%",
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: ringSegments.length > 0 } },
  };

  const ringLabel = hasDrafts(metrics)
    ? `${metrics.success_rate}% success: ${formatNumber(metrics.drafts_accepted)} accepted, ${formatNumber(metrics.drafts_rejected)} rejected, ${formatNumber(pending)} pending`
    : "No drafts yet";

  return (
    <Card sx={{ ...outlinedCardSx, height: "100%" }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%", boxSizing: "border-box", "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, minHeight: 64 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {kind}
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
              {title}
            </Typography>
            {note && (
              <Typography variant="body2" color="text.secondary">
                {note}
              </Typography>
            )}
          </Box>
          {actions && <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>{actions}</Box>}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 3, flex: 1 }}>
          <Box role="img" aria-label={ringLabel} sx={{ position: "relative", width: ringSize, height: ringSize, flexShrink: 0 }}>
            <Doughnut data={ringData} options={ringOptions} />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <Typography variant={valueVariant} fontWeight="bold" sx={{ color: toneColor, lineHeight: 1.1 }}>
                {hasDrafts(metrics) ? `${metrics.success_rate}%` : "—"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {hasDrafts(metrics) ? "success" : "no drafts"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, minWidth: 140, flex: 1 }}>
            {hasDrafts(metrics) ? (
              <>
                <Box>
                  <Typography variant={valueVariant} fontWeight="bold" sx={{ lineHeight: 1.1 }}>
                    {formatNumber(metrics.drafts_created)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    drafts created for {formatNumber(metrics.tickets_processed)} tickets processed
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ColorSwatch color={colors.accepted} />
                    <b>{formatNumber(metrics.drafts_accepted)}</b> accepted
                  </Typography>
                  <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ColorSwatch color={colors.rejected} variant="hatched" />
                    <b>{formatNumber(metrics.drafts_rejected)}</b> rejected
                  </Typography>
                  <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ColorSwatch color={colors.pending} />
                    <b>{formatNumber(pending)}</b> pending
                  </Typography>
                </Box>
                {comparison && <SuccessDeltaChip metrics={metrics} comparison={comparison} />}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No drafts in this period yet.
              </Typography>
            )}
          </Box>
        </Box>

        <Divider />
        <Typography variant="body2" color="text.secondary">
          <Box component="b" sx={{ color: "text.primary" }}>
            {formatNumber(metrics?.tickets_received ?? 0)}
          </Box>{" "}
          tickets received
        </Typography>
      </CardContent>
    </Card>
  );
};
