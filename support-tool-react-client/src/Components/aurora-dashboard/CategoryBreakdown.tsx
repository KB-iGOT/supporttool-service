import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowRight, UnfoldLess, UnfoldMore } from "@mui/icons-material";
import { noTextTransformSx, outlinedCardSx } from "./shared";
import { formatDateRange, formatDayLabel, formatMonthLong, formatMonthShort, formatNumber, formatShortDate, getMetricsTone, hasDrafts, humanizeLabel, parseIsoDate } from "./utils";
import { AuroraMetrics, AuroraCategory, PeriodScope, SortOrder, CategoryBreakdownProps, DraftSplitBarProps, CategoryRowsProps } from "./aurora.model";

/** Hides the number columns on small screens; the success chip stays visible. */
const numberColumnSx = { display: { xs: "none", sm: "table-cell" } };
const barColumnSx = { display: { xs: "none", md: "table-cell" } };
const TOGGLE_ICON_WIDTH = 34;

const compareCategories = (sortOrder: SortOrder) => (first: AuroraCategory, second: AuroraCategory) => {
  if (sortOrder === "lowestSuccess") {
    // Categories without drafts have no rate; keep them at the bottom.
    return (first.metrics.success_rate ?? Infinity) - (second.metrics.success_rate ?? Infinity);
  }
  return second.metrics.drafts_created - first.metrics.drafts_created;
};

const SuccessChip: React.FC<{ metrics: AuroraMetrics }> = ({ metrics }) => {
  const tone = getMetricsTone(metrics);
  return <Chip size="small" color={tone} label={hasDrafts(metrics) ? `${metrics.success_rate}%` : "—"} sx={{ minWidth: 64, fontWeight: 700 }} />;
};

/** Bar whose length is the draft count and whose split is accepted vs rejected. */
const DraftSplitBar: React.FC<DraftSplitBarProps> = ({ metrics, maxDrafts, isThin = false }) => {
  const theme = useTheme();
  const minVisibleWidth = metrics.drafts_created ? 3 : 0;
  const widthPercent = Math.max((metrics.drafts_created / maxDrafts) * 100, minVisibleWidth);

  return (
    <Tooltip title={`${formatNumber(metrics.drafts_accepted)} accepted, ${formatNumber(metrics.drafts_rejected)} rejected`} placement="top">
      <Box sx={{ display: "flex", gap: "2px", height: isThin ? 8 : 12, width: `${widthPercent}%`, borderRadius: 1, overflow: "hidden" }}>
        {metrics.drafts_accepted > 0 && <Box sx={{ flex: metrics.drafts_accepted, bgcolor: theme.palette.success.main }} />}
        {metrics.drafts_rejected > 0 && <Box sx={{ flex: metrics.drafts_rejected, bgcolor: theme.palette.error.light }} />}
      </Box>
    </Tooltip>
  );
};

const MetricCells: React.FC<{ metrics: AuroraMetrics }> = ({ metrics }) => (
  <>
    <TableCell align="right" sx={numberColumnSx}>
      {formatNumber(metrics.tickets_received)}
    </TableCell>
    <TableCell align="right" sx={numberColumnSx}>
      {formatNumber(metrics.drafts_created)}
    </TableCell>
    <TableCell align="right" sx={numberColumnSx}>
      {formatNumber(metrics.drafts_accepted)}
    </TableCell>
    <TableCell align="right" sx={numberColumnSx}>
      {formatNumber(metrics.drafts_rejected)}
    </TableCell>
    <TableCell align="right">
      <SuccessChip metrics={metrics} />
    </TableCell>
  </>
);

const CategoryRows: React.FC<CategoryRowsProps> = ({ category, isExpanded, maxCategoryDrafts, maxSubcategoryDrafts, onToggle }) => {
  const subcategories = category.subcategories ?? [];
  const hasSubcategories = subcategories.length > 0;
  const categoryName = humanizeLabel(category.name);

  return (
    <>
      <TableRow hover onClick={() => hasSubcategories && onToggle(category.id)} sx={{ cursor: hasSubcategories ? "pointer" : "default" }}>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {hasSubcategories ? (
              <IconButton
                size="small"
                aria-expanded={isExpanded}
                aria-label={`${categoryName}: ${isExpanded ? "hide" : "show"} sub-categories`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle(category.id);
                }}
              >
                {isExpanded ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowRight fontSize="small" />}
              </IconButton>
            ) : (
              <Box sx={{ width: TOGGLE_ICON_WIDTH }} />
            )}
            <Typography variant="body2" fontWeight={600}>
              {categoryName}
            </Typography>
          </Box>
        </TableCell>
        <TableCell sx={barColumnSx}>
          <DraftSplitBar metrics={category.metrics} maxDrafts={maxCategoryDrafts} />
        </TableCell>
        <MetricCells metrics={category.metrics} />
      </TableRow>

      {isExpanded &&
        subcategories.map((subcategory) => (
          <TableRow key={`${category.id}-${subcategory.id}`} sx={{ bgcolor: "action.hover" }}>
            <TableCell sx={{ pl: 8 }}>
              <Typography variant="body2" color="text.secondary">
                {humanizeLabel(subcategory.name)}
              </Typography>
            </TableCell>
            <TableCell sx={barColumnSx}>
              <DraftSplitBar metrics={subcategory.metrics} maxDrafts={maxSubcategoryDrafts} isThin />
            </TableCell>
            <MetricCells metrics={subcategory.metrics} />
          </TableRow>
        ))}
    </>
  );
};

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ overview, selectedWeekIndex }) => {
  const theme = useTheme();
  const [scope, setScope] = useState<PeriodScope>("month");
  const [sortOrder, setSortOrder] = useState<SortOrder>("mostDrafts");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const selectedWeek = overview.weeks[selectedWeekIndex];
  const weekStart = parseIsoDate(selectedWeek.start);
  const selectedDay = parseIsoDate(overview.day.date);
  const monthStart = parseIsoDate(overview.month.start);

  const periodByScope = { month: overview.month, week: selectedWeek, day: overview.day };
  const period = periodByScope[scope];

  const periodDescription = {
    month: `Month, ${formatMonthLong(monthStart)}`,
    week: `Week ${selectedWeek.index}, ${formatDateRange(weekStart, parseIsoDate(selectedWeek.end))} ${weekStart.getFullYear()}`,
    day: `${overview.day.is_today ? "Today" : "Day"}, ${formatDayLabel(selectedDay)} ${selectedDay.getFullYear()}`,
  }[scope];

  const categories = useMemo(() => {
    const byOrder = compareCategories(sortOrder);
    return (period.categories ?? [])
      .filter((category) => category.metrics.tickets_received || category.metrics.drafts_created)
      .map((category) => ({ ...category, subcategories: [...(category.subcategories ?? [])].sort(byOrder) }))
      .sort(byOrder);
  }, [period, sortOrder]);

  const maxCategoryDrafts = Math.max(1, ...categories.map((category) => category.metrics.drafts_created));
  const maxSubcategoryDrafts = Math.max(1, ...categories.flatMap((category) => category.subcategories.map((subcategory) => subcategory.metrics.drafts_created)));
  const expandableIds = categories.filter((category) => category.subcategories.length > 0).map((category) => category.id);
  const isAllExpanded = expandableIds.length > 0 && expandableIds.every((id) => expandedIds.has(id));

  const toggleCategory = (categoryId: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleAllCategories = () => setExpandedIds(isAllExpanded ? new Set() : new Set(expandableIds));

  const handleSortChange = (_event: React.MouseEvent<HTMLElement>, value: SortOrder | null) => {
    if (value) setSortOrder(value);
  };

  const handleScopeChange = (_event: React.MouseEvent<HTMLElement>, value: PeriodScope | null) => {
    if (value) setScope(value);
  };

  return (
    <Card sx={outlinedCardSx}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h6">Success by category</Typography>
            <Typography variant="body2" color="text.secondary">
              {periodDescription}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
            <Button size="small" variant="outlined" startIcon={isAllExpanded ? <UnfoldLess /> : <UnfoldMore />} onClick={toggleAllCategories} disabled={!expandableIds.length} sx={noTextTransformSx}>
              {isAllExpanded ? "Collapse all" : "Expand all"}
            </Button>
            <ToggleButtonGroup size="small" exclusive color="primary" value={sortOrder} onChange={handleSortChange} aria-label="Sort categories">
              <ToggleButton value="mostDrafts" sx={noTextTransformSx}>
                Most drafts
              </ToggleButton>
              <ToggleButton value="lowestSuccess" sx={noTextTransformSx}>
                Lowest success
              </ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup size="small" exclusive color="primary" value={scope} onChange={handleScopeChange} aria-label="Period for categories">
              <ToggleButton value="month" sx={noTextTransformSx}>
                {formatMonthShort(monthStart)} {monthStart.getFullYear()}
              </ToggleButton>
              <ToggleButton value="week" sx={noTextTransformSx}>
                Week {selectedWeek.index}
              </ToggleButton>
              <ToggleButton value="day" sx={noTextTransformSx}>
                {formatShortDate(selectedDay)}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 220 }}>Category</TableCell>
                <TableCell sx={{ ...barColumnSx, width: "28%" }}>Drafts: accepted vs rejected</TableCell>
                <TableCell align="right" sx={numberColumnSx}>
                  Received
                </TableCell>
                <TableCell align="right" sx={numberColumnSx}>
                  Drafts
                </TableCell>
                <TableCell align="right" sx={numberColumnSx}>
                  Accepted
                </TableCell>
                <TableCell align="right" sx={numberColumnSx}>
                  Rejected
                </TableCell>
                <TableCell align="right">Success</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    No tickets in this period.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {categories.map((category) => (
                    <CategoryRows
                      key={category.id}
                      category={category}
                      isExpanded={expandedIds.has(category.id)}
                      maxCategoryDrafts={maxCategoryDrafts}
                      maxSubcategoryDrafts={maxSubcategoryDrafts}
                      onToggle={toggleCategory}
                    />
                  ))}
                  {period.metrics && (
                    <TableRow sx={{ "& td": { fontWeight: 700, borderTop: `2px solid ${theme.palette.divider}`, borderBottom: 0 } }}>
                      <TableCell>
                        <Box sx={{ pl: `${TOGGLE_ICON_WIDTH + 8}px` }}>Total</Box>
                      </TableCell>
                      <TableCell sx={barColumnSx} />
                      <MetricCells metrics={period.metrics} />
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
