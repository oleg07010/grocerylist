// src/components/ItemRow.jsx
//
// One 58px-tall grocery row. Owns the check animation (checkbox pop + checkmark
// fade + dim) and the sink-to-bottom reorder. The reorder uses framer-motion's
// `layout`, gated OFF while this row is actively dragged so @hello-pangea/dnd
// keeps sole control of the transform during a drag.

import { useEffect, useRef } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { motion, useAnimationControls } from "framer-motion";
import { tokens } from "../theme/tokens";
import { DragDots, CheckmarkIcon, PinIcon, EditIcon, DeleteIcon } from "./icons";

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
          alignItems: "center",
          gap: "11px",
          height: 58,
          pl: "12px",
          pr: "10px",
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
            cursor: "grab",
            opacity: checked ? 0 : 1,
            pointerEvents: checked ? "none" : "auto",
            flexShrink: 0,
          }}
        >
          <DragDots />
        </Box>

        {/* Checkbox */}
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
          }}
        >
          <motion.div animate={controls}>
            <Box
              sx={{
                width: 21,
                height: 21,
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

        {/* Name + inline quantity */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            display: "flex",
            alignItems: "baseline",
            gap: "7px",
          }}
        >
          <Typography
            sx={{
              fontSize: 15.5,
              lineHeight: 1.25,
              color: checked ? tokens.color.inkMuted : tokens.color.ink,
              textDecoration: checked ? "line-through" : "none",
              textDecorationColor: tokens.color.strikethrough,
              minWidth: 0,
              flexShrink: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.name}
          </Typography>
          {item.qty ? (
            <Typography
              sx={{
                fontSize: 12.5,
                color: tokens.color.textTertiary,
                whiteSpace: "nowrap",
                flexShrink: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.qty}
            </Typography>
          ) : null}
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "1px", flexShrink: 0 }}>
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
          <IconButton
            aria-label="Edit item"
            onClick={() => onEdit(item)}
            sx={{ ...actionBtnSx, "&:active": { color: tokens.color.ink, bgcolor: tokens.color.pressEditBg } }}
          >
            <EditIcon size={15} />
          </IconButton>
          <IconButton
            aria-label="Delete item"
            onClick={() => onDelete(item)}
            sx={{ ...actionBtnSx, "&:active": { color: tokens.color.danger, bgcolor: tokens.color.pressDeleteBg } }}
          >
            <DeleteIcon size={15} />
          </IconButton>
        </Box>
      </Box>
    </motion.div>
  );
}
