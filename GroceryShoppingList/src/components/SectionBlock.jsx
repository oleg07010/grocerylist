// src/components/SectionBlock.jsx
import { Box, Typography } from "@mui/material";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { tokens } from "../theme/tokens";
import ItemRow from "./ItemRow";
import SectionOverflowMenu from "./SectionOverflowMenu";

export default function SectionBlock({
  section,
  items,
  index,
  sectionCount,
  isDragging,
  hasSearch,
  onRenameSection,
  onDeleteSection,
  onMoveSectionUp,
  onMoveSectionDown,
  onToggleItem,
  onTogglePinItem,
  onEditItem,
  onDeleteItem,
}) {
  const remaining = items.filter((i) => !i.checked).length;
  const meta =
    items.length === 0 ? "" : remaining === 0 ? "all done" : `${remaining} left`;

  return (
    <Box>
      {/* Text header on the background (no filled bar) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", px: "6px", pb: "9px" }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            color: tokens.color.textSecondary,
            lineHeight: 1,
          }}
        >
          {section.name}
        </Typography>
        {meta && (
          <Typography
            sx={{ fontSize: 11, fontWeight: 500, color: tokens.color.textTertiary, lineHeight: 1 }}
          >
            {meta}
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <SectionOverflowMenu
          isDefault={!!section.isDefault}
          canMoveUp={index > 0}
          canMoveDown={index < sectionCount - 1}
          onRename={() => onRenameSection(section)}
          onDelete={() => onDeleteSection(section)}
          onMoveUp={() => onMoveSectionUp(index)}
          onMoveDown={() => onMoveSectionDown(index)}
        />
      </Box>

      {/* Rows card */}
      <Box
        sx={{
          bgcolor: tokens.color.surface,
          borderRadius: `${tokens.radius.card}px`,
          overflow: "hidden",
          boxShadow: `${tokens.shadow.card}, ${tokens.shadow.ring}`,
        }}
      >
        <Droppable droppableId={section.id} type="ITEM">
          {(dropProv, dropSnap) => (
            <Box
              ref={dropProv.innerRef}
              {...dropProv.droppableProps}
              sx={{
                minHeight: 8,
                bgcolor: dropSnap.isDraggingOver ? tokens.color.accentSoft : "transparent",
                transition: "background 0.2s",
              }}
            >
              {items.length === 0 && !dropSnap.isDraggingOver && (
                <Box sx={{ py: "16px", textAlign: "center" }}>
                  <Typography sx={{ fontSize: 12.5, color: tokens.color.textTertiary }}>
                    {hasSearch ? "No matches" : "Nothing here yet"}
                  </Typography>
                </Box>
              )}
              {items.map((item, i) => (
                <Draggable
                  key={item.id}
                  draggableId={item.id}
                  index={i}
                  isDragDisabled={!!item.checked}
                >
                  {(dragProv, dragSnap) => (
                    <ItemRow
                      item={item}
                      provided={dragProv}
                      snapshot={dragSnap}
                      isFirst={i === 0}
                      isDragging={isDragging}
                      onToggle={onToggleItem}
                      onTogglePin={onTogglePinItem}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                    />
                  )}
                </Draggable>
              ))}
              {dropProv.placeholder}
            </Box>
          )}
        </Droppable>
      </Box>
    </Box>
  );
}
