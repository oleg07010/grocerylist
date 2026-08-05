// src/components/Header.jsx
import { Box, IconButton, Typography } from "@mui/material";
import { tokens } from "../theme/tokens";
import { CartIcon, SearchIcon, AddSectionIcon } from "./icons";
import ProgressBar from "./ProgressBar";

const iconBtnSx = {
  width: 34,
  height: 34,
  color: tokens.color.textSecondary,
  "&:active": { color: tokens.color.ink },
};

export default function Header({
  done,
  total,
  remaining,
  resetDisabled,
  onReset,
  onSearch,
  onAddSection,
}) {
  return (
    <Box
      sx={{
        bgcolor: tokens.color.surface,
        borderBottom: `1px solid ${tokens.color.border}`,
        pt: "calc(env(safe-area-inset-top) + 14px)",
        pb: "14px",
        px: "20px",
      }}
    >
      {/* Row 1 — brand + actions */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: `${tokens.radius.control}px`,
            bgcolor: tokens.color.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CartIcon />
        </Box>
        <Typography
          sx={{
            fontSize: 19,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            color: tokens.color.ink,
          }}
        >
          GrocerySync
        </Typography>
        <Box sx={{ flex: 1 }} />
        <IconButton aria-label="Search items" onClick={onSearch} sx={iconBtnSx}>
          <SearchIcon size={18} />
        </IconButton>
        <IconButton aria-label="Add section" onClick={onAddSection} sx={iconBtnSx}>
          <AddSectionIcon size={18} />
        </IconButton>
      </Box>

      {/* Row 2 — progress + reset */}
      <Box sx={{ mt: "16px" }}>
        <ProgressBar
          done={done}
          total={total}
          remaining={remaining}
          resetDisabled={resetDisabled}
          onReset={onReset}
        />
      </Box>
    </Box>
  );
}
