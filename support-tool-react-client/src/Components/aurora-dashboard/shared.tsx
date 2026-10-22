import React, { useCallback, useMemo, useState } from "react";
import { Box, IconButton, SxProps, Theme, ThemeOptions, ToggleButton, ToggleButtonGroup, Tooltip, createTheme } from "@mui/material";
import { ChevronLeft, ChevronRight, DarkMode, LightMode } from "@mui/icons-material";
import { ColorSwatchProps, StepButtonProps, ThemeMode, ThemeModeToggleProps } from "./aurora.model";

/* ───────── Theme ───────── */

const THEME_MODE_STORAGE_KEY = "aurora-dashboard-theme-mode";

/** Dark mode uses the "Dusk" palette from the original Aurora dashboard design. */
const duskThemeOptions: ThemeOptions = {
  palette: {
    mode: "dark",
    background: { default: "#1B2436", paper: "#263148" },
    text: { primary: "#F4F7FC", secondary: "#AAB7D0" },
    divider: "#3E4D70",
    primary: { main: "#A9BBFF", contrastText: "#1B2436" },
    // success.main fills accepted drafts; error.light fills rejected drafts and error.main colours low rates.
    success: { main: "#4FD9A6" },
    warning: { main: "#F5CC6C" },
    error: { main: "#FFB3A3", light: "#FF8F7B" },
    grey: { 400: "#8C9CBF" },
    action: { hover: "#2E3A55", disabledBackground: "#46557A" },
  },
  components: {
    // MUI lightens dark-mode surfaces with an overlay; keep the exact Dusk surface colour instead.
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
  },
};

const lightThemeOptions: ThemeOptions = { palette: { mode: "light" } };

const DEFAULT_THEME_MODE: ThemeMode = "dark";

/** Dark unless the viewer has switched to light before. */
const readStoredThemeMode = (): ThemeMode => {
  try {
    return localStorage.getItem(THEME_MODE_STORAGE_KEY) === "light" ? "light" : DEFAULT_THEME_MODE;
  } catch {
    return DEFAULT_THEME_MODE;
  }
};

/** Light/dark theme scoped to the Aurora dashboard; the choice is remembered in this browser. */
export const useDashboardTheme = () => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(readStoredThemeMode);
  const theme = useMemo(() => createTheme(themeMode === "dark" ? duskThemeOptions : lightThemeOptions), [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the toggle still works for this visit.
    }
  }, []);

  return { theme, themeMode, setThemeMode };
};

/* ───────── Styles ───────── */

/** Flat, bordered card used across the support tool dashboards. */
export const outlinedCardSx = {
  border: (theme: Theme) => `1px solid ${theme.palette.divider}`,
  boxShadow: "none",
  borderRadius: 2,
};

export const noTextTransformSx: SxProps<Theme> = { textTransform: "none" };

/* ───────── Components ───────── */

/** Small colour key shown next to a legend label. */
export const ColorSwatch: React.FC<ColorSwatchProps> = ({ color }) => (
  <Box component="span" aria-hidden="true" sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: color, display: "inline-block", flexShrink: 0 }} />
);

/** Outlined chevron button for stepping to the previous or next month, week or day. */
export const StepButton: React.FC<StepButtonProps> = ({ direction, label, disabled = false, onClick }) => (
  <Tooltip title={disabled ? "" : label}>
    {/* The span keeps the tooltip working while the button is disabled. */}
    <span>
      <IconButton size="small" aria-label={label} disabled={disabled} onClick={onClick} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        {direction === "previous" ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
      </IconButton>
    </span>
  </Tooltip>
);

const themeOptionSx: SxProps<Theme> = { textTransform: "none", gap: 0.75, px: 1.5 };

/** Segmented Light / Dark switch for the dashboard theme. */
export const ThemeModeToggle: React.FC<ThemeModeToggleProps> = ({ mode, onChange }) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, value: ThemeMode | null) => {
    if (value) onChange(value);
  };

  return (
    <ToggleButtonGroup size="small" exclusive color="primary" value={mode} onChange={handleChange} aria-label="Colour theme">
      <ToggleButton value="light" sx={themeOptionSx}>
        <LightMode fontSize="small" />
        Light
      </ToggleButton>
      <ToggleButton value="dark" sx={themeOptionSx}>
        <DarkMode fontSize="small" />
        Dark
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
