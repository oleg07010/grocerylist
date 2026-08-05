// src/lib/listLogic.js
//
// Pure, framework-free logic extracted from App.jsx. Keeping it here means it can
// be unit-tested in isolation and reused without duplicating the same expressions
// inline in the component. Every function mirrors the original App.jsx behavior
// exactly — including the `order ?? 0` fallbacks and the `sectionId || generalSectionId`
// default-section resolution — so extracting them is behavior-preserving.

/** Case-insensitive substring match on item name (search box filter). */
export const filterItems = (items, search) =>
  items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

/** Count of checked items ("done"). */
export const countDone = (items) => items.filter((i) => i.checked).length;

/** Items eligible for reset: checked and NOT pinned (skipReset). */
export const resettableItems = (items) =>
  items.filter((i) => i.checked && !i.skipReset);

/** How many items a reset would uncheck. */
export const countResettable = (items) => resettableItems(items).length;

/** Id of the default ("General") section, falling back to the first section. */
export const getGeneralSectionId = (sections) =>
  sections.find((s) => s.isDefault)?.id || sections[0]?.id;

/**
 * Items belonging to a section (items with no sectionId fall back to General),
 * sorted ascending by `order`. Stable for equal orders (ES2019 sort).
 */
export const getSectionItems = (items, sectionId, generalSectionId) =>
  items
    .filter((i) => (i.sectionId || generalSectionId) === sectionId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

/**
 * Next `order` for an item appended to a section: max existing order + 1,
 * or 0 when the section is empty.
 */
export const nextItemOrder = (items, sectionId, generalSectionId) => {
  const sectionItems = items.filter(
    (i) => (i.sectionId || generalSectionId) === sectionId
  );
  const maxOrder =
    sectionItems.length > 0
      ? Math.max(...sectionItems.map((i) => i.order ?? 0))
      : -1;
  return maxOrder + 1;
};

/** Next `order` for a newly added section: max existing order + 1, or 0 when none. */
export const nextSectionOrder = (sections) => {
  const maxOrder =
    sections.length > 0 ? Math.max(...sections.map((s) => s.order ?? 0)) : -1;
  return maxOrder + 1;
};

/**
 * After the sections list reloads, keep the previously-selected section id if it
 * still exists, otherwise select the first section.
 */
export const reconcileSelectedSection = (prevId, sections) => {
  const ids = sections.map((s) => s.id);
  return ids.includes(prevId) ? prevId : ids[0];
};

/**
 * Reorder sections by moving one from `fromIndex` to `toIndex`.
 * Returns [{ id, order }] descriptors to persist (order = new index).
 */
export const reorderSections = (sections, fromIndex, toIndex) => {
  const reordered = Array.from(sections);
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  return reordered.map((s, idx) => ({ id: s.id, order: idx }));
};

/**
 * Reorder items within a section or move one across sections.
 * `source`/`destination` are drag-drop payloads: { droppableId, index }.
 * Returns [{ id, order, sectionId? }] descriptors to persist:
 *   - within one section: every item gets { order, sectionId }
 *   - across sections: source-side items get { order } only (their section is
 *     unchanged); the moved item + dest-side items get { order, sectionId }.
 * This asymmetry mirrors the original App.jsx batch writes exactly.
 */
export const reorderItems = (items, source, destination, generalSectionId) => {
  const sourceSectionId = source.droppableId;
  const destSectionId = destination.droppableId;

  // getSectionItems returns a fresh filtered+sorted array, so it is safe to splice.
  const sourceItems = getSectionItems(items, sourceSectionId, generalSectionId);

  const [movedItem] = sourceItems.splice(source.index, 1);

  if (sourceSectionId === destSectionId) {
    sourceItems.splice(destination.index, 0, movedItem);
    return sourceItems.map((item, idx) => ({
      id: item.id,
      order: idx,
      sectionId: destSectionId,
    }));
  }

  const destItems = getSectionItems(items, destSectionId, generalSectionId);
  destItems.splice(destination.index, 0, movedItem);

  return [
    ...sourceItems.map((item, idx) => ({ id: item.id, order: idx })),
    ...destItems.map((item, idx) => ({
      id: item.id,
      order: idx,
      sectionId: destSectionId,
    })),
  ];
};
