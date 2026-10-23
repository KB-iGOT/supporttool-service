import React from "react";
import { Box, Card, CardContent, Chip, Divider, Typography, useTheme } from "@mui/material";
import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material";
import { Chart as ChartJS, ArcElement, Tooltip, ChartData, ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { ColorSwatch, outlinedCardSx } from "./shared";
import { formatNumber, getMetricsTone, hasDrafts, percentOf } from "./utils";
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
  const acceptedColor = theme.palette.success.main;
  const rejectedColor = theme.palette.error.light;

  const ringData: ChartData<"doughnut"> = hasDrafts(metrics)
    ? {
        labels: ["Accepted", "Rejected"],
        datasets: [
          {
            data: [metrics.drafts_accepted, metrics.drafts_rejected],
            backgroundColor: [acceptedColor, rejectedColor],
            borderColor: theme.palette.background.paper,
            borderWidth: metrics.drafts_accepted && metrics.drafts_rejected ? 2 : 0,
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
    plugins: { legend: { display: false }, tooltip: { enabled: hasDrafts(metrics) } },
  };

  const ringLabel = hasDrafts(metrics) ? `${metrics.success_rate}% success: ${metrics.drafts_accepted} accepted, ${metrics.drafts_rejected} rejected` : "No drafts yet";

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
                    drafts created
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ColorSwatch color={acceptedColor} />
                    <b>{formatNumber(metrics.drafts_accepted)}</b> accepted
                  </Typography>
                  <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ColorSwatch color={rejectedColor} variant="hatched" />
                    <b>{formatNumber(metrics.drafts_rejected)}</b> rejected
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
          {metrics?.tickets_received ? `, ${percentOf(metrics.drafts_created, metrics.tickets_received)}% got a draft` : ""}
        </Typography>
      </CardContent>
    </Card>
  );
};
