// src/components/ItemRow.jsx
//
// One grocery row (min 58px tall). Owns the check animation (checkbox pop +
// checkmark fade + dim) and the sink-to-bottom reorder. The reorder uses
// framer-motion's `layout`, gated OFF while this row is actively dragged so
// @hello-pangea/dnd keeps sole control of the transform during a drag.
//
// Layout: [drag handle] [checkbox] [text column: title + wrapping details]
// [actions: pin, ⋯]. The text column is a vertical stack so a long `qty`
// (brand / notes) wraps under the title instead of squeezing it to an ellipsis.

import { useEffect, useRef } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { motion, useAnimationControls } from "framer-motion";
import { tokens } from "../theme/tokens";
import { DragDots, CheckmarkIcon, PinIcon } from "./icons";
import ItemOverflowMenu from "./ItemOverflowMenu";

const actionBtnSx = {
  width: 30,
  height: 30,
  borderRadius: `${tokens.radius.control}px`,
  color: tokens.color.textQuaternary,
  transition: "background-color 150ms, color 150ms",
};

export default function ItemRow({
  item,
  provided,
  snapshot,
  isFirst,
  isDragging,
  onToggle,
  onTogglePin,
  onEdit,
  onDelete,
}) {
  const checked = !!item.checked;
  const pinned = !!item.skipReset;

  // Pop the checkbox only on the unchecked -> checked transition.
  const controls = useAnimationControls();
  const prevChecked = useRef(checked);
  useEffect(() => {
    if (checked && !prevChecked.current) {
      controls.start({
        scale: [1, 1.04, 1],
        transition: {
          duration: tokens.motion.checkSpringDur,
          ease: tokens.motion.checkSpringEase,
        },
      });
    }
    prevChecked.current = checked;
  }, [checked, controls]);

  return (
    <motion.div
      ref={provided.innerRef}
      {...provided.draggableProps}
      layout={isDragging ? false : "position"}
      animate={{ opacity: checked ? 0.5 : 1 }}
      transition={{
        opacity: { duration: tokens.motion.dim, ease: "easeInOut" },
        layout: { duration: tokens.motion.reorder, ease: "easeOut" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          minHeight: 58,
          p: "13px 12px",
          boxSizing: "border-box",
          bgcolor: snapshot.isDragging ? tokens.color.bg : tokens.color.surface,
          borderTop: isFirst ? "none" : `1px solid ${tokens.color.hairline}`,
        }}
      >
        {/* Drag handle — hidden + inert for checked rows (they sort by checkedAt) */}
        <Box
          {...provided.dragHandleProps}
          sx={{
            display: "flex",
            alignItems: "center",
            alignSelf: "center",
            cursor: "grab",
            opacity: checked ? 0 : 1,
            pointerEvents: checked ? "none" : "auto",
            flexShrink: 0,
          }}
        >
          <DragDots />
        </Box>

        {/* Checkbox — top-aligned to the title's first line, not a paragraph's middle */}
        <Box
          component="button"
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label={item.name}
          onClick={() => onToggle(item)}
          sx={{
            p: 0,
            m: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignSelf: "flex-start",
            mt: "1px",
          }}
        >
          <motion.div animate={controls}>
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: `${tokens.radius.check}px`,
                border: `1.6px solid ${
                  checked ? tokens.color.accent : tokens.color.checkboxBorder
                }`,
                bgcolor: checked ? tokens.color.accent : tokens.color.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 150ms, border-color 150ms",
              }}
            >
              {checked && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: tokens.motion.checkmarkFade }}
                  style={{ display: "flex" }}
                >
                  <CheckmarkIcon />
                </motion.span>
              )}
            </Box>
          </motion.div>
        </Box>

        {/* Title + wrapping details */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 1.3,
              letterSpacing: "-0.005em",
              color: checked ? tokens.color.inkMuted : tokens.color.ink,
              textDecoration: checked ? "line-through" : "none",
              textDecorationColor: tokens.color.strikethrough,
              minWidth: 0,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {item.name}
          </Typography>
          {item.qty ? (
            <Typography
              sx={{
                fontSize: 13.5,
                fontWeight: 400,
                lineHeight: 1.5,
                // Darker than a decorative gray — this is a shopping instruction
                // that has to stay legible in a store. Never struck through.
                color: checked ? tokens.color.textTertiary : tokens.color.textSecondary,
                minWidth: 0,
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {item.qty}
            </Typography>
          ) : null}
        </Box>

        {/* Actions — top-aligned with the title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          <IconButton
            aria-label={pinned ? "Unpin item" : "Pin item"}
            aria-pressed={pinned}
            onClick={() => onTogglePin(item)}
            sx={{
              ...actionBtnSx,
              color: pinned ? tokens.color.accent : tokens.color.textQuaternary,
              bgcolor: pinned ? tokens.color.accentSoft : "transparent",
              transition: `background-color ${tokens.motion.pinFade}s, color ${tokens.motion.pinFade}s`,
            }}
          >
            <PinIcon size={16} />
          </IconButton>
          <ItemOverflowMenu onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
        </Box>
      </Box>
    </motion.div>
  );
}
