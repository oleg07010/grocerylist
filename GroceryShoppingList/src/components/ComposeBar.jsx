// src/components/ComposeBar.jsx
import { useState } from "react";
import { Box, InputBase, IconButton, ButtonBase, Menu, MenuItem } from "@mui/material";
import { tokens } from "../theme/tokens";
import { PlusIcon } from "./icons";

export default function ComposeBar({
  value,
  qty,
  sections,
  selectedSectionId,
  onChange,
  onQtyChange,
  onSelectSection,
  onSubmit,
}) {
  const [focused, setFocused] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const sectionName = sections.find((s) => s.id === selectedSectionId)?.name;

  const submit = () => {
    if (value.trim()) onSubmit();
  };

  return (
    <Box
      sx={{
        bgcolor: tokens.color.surface,
        borderTop: `1px solid ${tokens.color.border}`,
        px: "16px",
        pt: "10px",
        pb: "calc(env(safe-area-inset-bottom) + 10px)",
      }}
    >
      {focused && (
        <Box sx={{ display: "flex", mb: "8px" }}>
          <InputBase
            value={qty}
            onChange={(e) => onQtyChange(e.target.value)}
            placeholder="Qty / note (optional)"
            sx={{
              flex: 1,
              height: 38,
              borderRadius: `${tokens.radius.pill}px`,
              bgcolor: tokens.color.composeField,
              px: "15px",
              fontSize: 13.5,
              color: tokens.color.ink,
              "& input::placeholder": { color: tokens.color.textTertiary, opacity: 1 },
            }}
          />
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: "9px" }}>
        <Box
          sx={{
            flex: 1,
            height: 44,
            borderRadius: `${tokens.radius.pill}px`,
            bgcolor: tokens.color.composeField,
            display: "flex",
            alignItems: "center",
            pl: "15px",
            pr: "6px",
            gap: "8px",
          }}
        >
          <InputBase
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Add an item…"
            autoComplete="off"
            sx={{
              flex: 1,
              fontSize: 14.5,
              color: tokens.color.ink,
              "& input::placeholder": { color: tokens.color.textTertiary, opacity: 1 },
            }}
          />
          {sectionName && (
            <ButtonBase
              aria-label="Choose section"
              onClick={(e) => setAnchor(e.currentTarget)}
              sx={{
                flexShrink: 0,
                borderRadius: `${tokens.radius.pill}px`,
                bgcolor: tokens.color.accentSoft,
                color: tokens.color.accent,
                px: "9px",
                py: "5px",
                fontSize: 11,
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {sectionName}
            </ButtonBase>
          )}
        </Box>

        <IconButton
          aria-label="Add item"
          onClick={submit}
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            bgcolor: tokens.color.accent,
            color: "#fff",
            "&:hover": { bgcolor: tokens.color.accent },
            "&:active": { bgcolor: tokens.color.accentPressed },
          }}
        >
          <PlusIcon size={20} strokeWidth={2.3} color="#fff" />
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        {sections.map((s) => (
          <MenuItem
            key={s.id}
            selected={s.id === selectedSectionId}
            onClick={() => {
              onSelectSection(s.id);
              setAnchor(null);
            }}
          >
            {s.name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
