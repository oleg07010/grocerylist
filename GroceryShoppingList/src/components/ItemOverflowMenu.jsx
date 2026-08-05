// src/components/ItemOverflowMenu.jsx
//
// The per-row "⋯" menu. Replaces the always-visible pencil + trash so the row
// can give that horizontal space to the wrapping description, and moves the
// destructive Delete a tap away from the checkbox. Mirrors SectionOverflowMenu.

import { useState } from "react";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { tokens } from "../theme/tokens";
import { MoreVerticalIcon, EditIcon, DeleteIcon } from "./icons";

export default function ItemOverflowMenu({ onEdit, onDelete }) {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);
  const run = (fn) => () => {
    close();
    fn();
  };

  return (
    <>
      <IconButton
        aria-label="Item options"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          width: 30,
          height: 30,
          borderRadius: `${tokens.radius.control}px`,
          color: tokens.color.textQuaternary,
          transition: "background-color 150ms, color 150ms",
        }}
      >
        <MoreVerticalIcon size={16} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={run(onEdit)}>
          <ListItemIcon>
            <EditIcon size={16} />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(onDelete)} sx={{ color: tokens.color.danger }}>
          <ListItemIcon sx={{ color: tokens.color.danger }}>
            <DeleteIcon size={16} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
