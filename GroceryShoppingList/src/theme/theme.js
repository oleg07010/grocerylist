// src/theme/theme.js
//
// MUI theme derived from the design tokens. Components read palette-mapped values
// through MUI as usual and pull raw tokens (radii, hairlines, motion) either from
// `theme.tokens` or by importing `tokens` directly.

import { createTheme } from "@mui/material/styles";
import { tokens } from "./tokens";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: tokens.color.accent,
      dark: tokens.color.accentPressed,
      light: tokens.color.accentSoft,
    },
    error: { main: tokens.color.danger },
    background: { default: tokens.color.bg, paper: tokens.color.surface },
    text: { primary: tokens.color.ink, secondary: tokens.color.textSecondary },
  },
  typography: {
    fontFamily: tokens.font.family,
  },
  shape: { borderRadius: tokens.radius.card },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: tokens.font.weight.semibold },
      },
    },
  },
});

// Escape hatch so components can reach raw tokens via useTheme() inside sx.
theme.tokens = tokens;
