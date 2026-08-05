// src/components/AppShell.jsx
//
// Three fixed regions in a column: header (fixed), the only scrolling region, and
// the compose bar (fixed bottom). Safe-area insets are owned by the header (top)
// and compose bar (bottom); the scroll region sits between them.

import { Box } from "@mui/material";
import { tokens } from "../theme/tokens";

export default function AppShell({ header, children, compose }) {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: tokens.color.bg,
      }}
    >
      <Box sx={{ flex: "0 0 auto", zIndex: 2 }}>{header}</Box>
      <Box
        sx={{
          flex: "1 1 auto",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {children}
      </Box>
      <Box sx={{ flex: "0 0 auto", zIndex: 2 }}>{compose}</Box>
    </Box>
  );
}
