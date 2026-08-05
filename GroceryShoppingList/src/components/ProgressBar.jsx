// src/components/ProgressBar.jsx
import { Box, Typography, ButtonBase } from "@mui/material";
import { motion } from "framer-motion";
import { tokens } from "../theme/tokens";
import { ResetIcon } from "./icons";

export default function ProgressBar({ done, total, remaining, resetDisabled, onReset }) {
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <Box
        sx={{
          flex: 1,
          height: 5,
          borderRadius: 999,
          bgcolor: tokens.color.track,
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{ height: "100%", borderRadius: 999, background: tokens.color.accent }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: tokens.motion.progress, ease: [0.4, 0, 0.2, 1] }}
        />
      </Box>

      <Typography
        sx={{ fontSize: 12, fontWeight: 500, color: tokens.color.ink, whiteSpace: "nowrap" }}
      >
        {remaining} left
      </Typography>

      <ButtonBase
        onClick={onReset}
        disabled={resetDisabled}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          border: "1px solid rgba(18,32,28,0.12)",
          bgcolor: tokens.color.surface,
          borderRadius: 999,
          py: "5px",
          pl: "9px",
          pr: "11px",
          color: tokens.color.textSecondary,
          transition: "color 150ms, border-color 150ms",
          "&:active": {
            borderColor: tokens.color.accent,
            color: tokens.color.accent,
          },
          "&.Mui-disabled": { opacity: 0.4 },
        }}
      >
        <ResetIcon size={13} />
        <Typography component="span" sx={{ fontSize: 11.5, fontWeight: 500, lineHeight: 1 }}>
          Reset list
        </Typography>
      </ButtonBase>
    </Box>
  );
}
