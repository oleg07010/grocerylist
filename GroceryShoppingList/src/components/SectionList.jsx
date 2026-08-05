// src/components/SectionList.jsx
//
// The scrollable list region. Owns the DragDropContext for ITEM drags (section
// reordering lives in the "…" menu, so there is no SECTION droppable). Tracks a
// global `dragging` flag via onDragStart/onDragEnd and passes it down so every
// ItemRow disables framer-motion `layout` for the duration of a drag — otherwise
// framer would fight dnd over the transforms it applies to shift sibling rows.

import { useState } from "react";
import { Box } from "@mui/material";
import { DragDropContext } from "@hello-pangea/dnd";
import SectionBlock from "./SectionBlock";

export default function SectionList({
  sections,
  getItems,
  hasSearch,
  onItemDragEnd,
  onRenameSection,
  onDeleteSection,
  onMoveSectionUp,
  onMoveSectionDown,
  onToggleItem,
  onTogglePinItem,
  onEditItem,
  onDeleteItem,
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <Box sx={{ px: "16px", pt: "18px", pb: "8px" }}>
      <DragDropContext
        onDragStart={() => setDragging(true)}
        onDragEnd={(result) => {
          setDragging(false);
          onItemDragEnd(result);
        }}
      >
        {sections.map((section, i) => (
          <Box key={section.id} sx={{ mb: "22px" }}>
            <SectionBlock
              section={section}
              items={getItems(section.id)}
              index={i}
              sectionCount={sections.length}
              isDragging={dragging}
              hasSearch={hasSearch}
              onRenameSection={onRenameSection}
              onDeleteSection={onDeleteSection}
              onMoveSectionUp={onMoveSectionUp}
              onMoveSectionDown={onMoveSectionDown}
              onToggleItem={onToggleItem}
              onTogglePinItem={onTogglePinItem}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />
          </Box>
        ))}
      </DragDropContext>
    </Box>
  );
}
