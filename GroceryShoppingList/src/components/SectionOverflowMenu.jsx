// src/components/SectionOverflowMenu.jsx
import { useState } from "react";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { tokens } from "../theme/tokens";
import { MoreIcon, EditIcon, DeleteIcon, MoveUpIcon, MoveDownIcon } from "./icons";

export default function SectionOverflowMenu({
  isDefault,
  canMoveUp,
  canMoveDown,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
}) {
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);
  const run = (fn) => () => {
    close();
    fn();
  };

  return (
    <>
      <IconButton
        aria-label="Section options"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ width: 24, height: 24, color: "#B3BEB9" }}
      >
        <MoreIcon size={16} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={run(onRename)}>
          <ListItemIcon>
            <EditIcon size={16} />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(onMoveUp)} disabled={!canMoveUp}>
          <ListItemIcon>
            <MoveUpIcon size={16} />
          </ListItemIcon>
          <ListItemText>Move up</ListItemText>
        </MenuItem>
        <MenuItem onClick={run(onMoveDown)} disabled={!canMoveDown}>
          <ListItemIcon>
            <MoveDownIcon size={16} />
          </ListItemIcon>
          <ListItemText>Move down</ListItemText>
        </MenuItem>
        {!isDefault && (
          <MenuItem onClick={run(onDelete)} sx={{ color: tokens.color.danger }}>
            <ListItemIcon sx={{ color: tokens.color.danger }}>
              <DeleteIcon size={16} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
