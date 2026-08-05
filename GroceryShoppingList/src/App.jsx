import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, writeBatch, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  splitLegacyName,
  filterItems, countDone, countResettable, resettableItems,
  getGeneralSectionId, getSectionItems, nextItemOrder, nextSectionOrder,
  reconcileSelectedSection, reorderSections, reorderItems,
} from "./lib/listLogic";
import { lightImpact } from "./lib/haptics";

import {
  Box, Typography, TextField, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Snackbar, Alert, Select, MenuItem, FormControl, InputLabel,
  InputBase, CircularProgress, CssBaseline,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme/theme";
import { tokens } from "./theme/tokens";

import AppShell from "./components/AppShell";
import Header from "./components/Header";
import SectionList from "./components/SectionList";
import ComposeBar from "./components/ComposeBar";

const DEFAULT_SECTION = "general";

export default function App() {
  const [items, setItems] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newSection, setNewSection] = useState(DEFAULT_SECTION);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editSection, setEditSection] = useState(DEFAULT_SECTION);

  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [renameSectionOpen, setRenameSectionOpen] = useState(false);
  const [renameSectionTarget, setRenameSectionTarget] = useState(null);
  const [renameSectionValue, setRenameSectionValue] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    const qItems = query(collection(db, "groceries"), orderBy("order", "asc"));
    const unsubItems = onSnapshot(qItems, (snap) => {
      // Read-time migration: legacy items packed the whole text into `name` with
      // an empty `qty`. Split those into a title + details for display; the split
      // persists the next time the item is edited (the dialog pre-fills it).
      setItems(snap.docs.map((d) => {
        const raw = { id: d.id, ...d.data() };
        const { name, qty } = splitLegacyName(raw.name, raw.qty || "");
        return { ...raw, name, qty };
      }));
      setLoading(false);
    });
    const qSections = query(collection(db, "sections"), orderBy("order", "asc"));
    const unsubSections = onSnapshot(qSections, async (snap) => {
      const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (fetched.length === 0) {
        const ref = await addDoc(collection(db, "sections"), {
          name: "General", isDefault: true, order: 0,
        });
        setSections([{ id: ref.id, name: "General", isDefault: true, order: 0 }]);
        setNewSection(ref.id);
      } else {
        setSections(fetched);
        setNewSection((prev) => reconcileSelectedSection(prev, fetched));
      }
    });
    return () => { unsubItems(); unsubSections(); };
  }, []);

  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });
  const filtered = filterItems(items, search);
  const doneCount = countDone(items);
  const resettableCount = countResettable(items);
  const generalSectionId = getGeneralSectionId(sections);
  const getItems = (sectionId) => getSectionItems(filtered, sectionId, generalSectionId);

  const handleAdd = async () => {
    const name = newItem.trim();
    if (!name) return;
    await addDoc(collection(db, "groceries"), {
      name, qty: newQty.trim() || "", checked: false, skipReset: false,
      sectionId: newSection, order: nextItemOrder(items, newSection, generalSectionId),
      createdAt: serverTimestamp(),
    });
    setNewItem(""); setNewQty("");
    showSnack(`"${name}" added!`);
  };

  const handleToggle = (item) => {
    if (!item.checked) lightImpact();
    return updateDoc(doc(db, "groceries", item.id), {
      checked: !item.checked,
      checkedAt: item.checked ? null : Date.now(),
    });
  };

  const handleTogglePin = (item) =>
    updateDoc(doc(db, "groceries", item.id), { skipReset: !item.skipReset });

  const handleDelete = async (item) => {
    await deleteDoc(doc(db, "groceries", item.id));
    showSnack(`"${item.name}" removed`, "info");
  };

  const handleEditOpen = (item) => {
    setEditItem(item); setEditName(item.name);
    setEditQty(item.qty || ""); setEditSection(item.sectionId || generalSectionId);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editName.trim()) return;
    await updateDoc(doc(db, "groceries", editItem.id), {
      name: editName.trim(), qty: editQty.trim(), sectionId: editSection,
    });
    setEditOpen(false); showSnack("Item updated!");
  };

  const handleReset = async () => {
    const toUncheck = resettableItems(items);
    if (toUncheck.length === 0) {
      setResetOpen(false);
      showSnack("Nothing to reset — all checked items are pinned.", "info");
      return;
    }
    const batch = writeBatch(db);
    toUncheck.forEach((i) =>
      batch.update(doc(db, "groceries", i.id), { checked: false, checkedAt: null })
    );
    await batch.commit();
    setResetOpen(false);
    showSnack(`${toUncheck.length} item(s) unchecked. Pinned items stayed checked.`);
  };

  const handleAddSection = async () => {
    const name = newSectionName.trim();
    if (!name) return;
    await addDoc(collection(db, "sections"), { name, order: nextSectionOrder(sections) });
    setNewSectionName(""); setAddSectionOpen(false);
    showSnack(`Section "${name}" added!`);
  };

  const handleRenameSectionOpen = (section) => {
    setRenameSectionTarget(section); setRenameSectionValue(section.name);
    setRenameSectionOpen(true);
  };

  const handleRenameSectionSave = async () => {
    if (!renameSectionValue.trim() || !renameSectionTarget) return;
    await updateDoc(doc(db, "sections", renameSectionTarget.id), { name: renameSectionValue.trim() });
    setRenameSectionOpen(false); showSnack("Section renamed!");
  };

  const handleDeleteSection = async (section) => {
    const sectionItems = items.filter((i) => i.sectionId === section.id);
    const batch = writeBatch(db);
    sectionItems.forEach((i) =>
      batch.update(doc(db, "groceries", i.id), { sectionId: generalSectionId })
    );
    batch.delete(doc(db, "sections", section.id));
    await batch.commit();
    showSnack("Section removed, items moved to General", "info");
  };

  const handleReorderSection = async (from, to) => {
    if (from === to || to < 0 || to >= sections.length) return;
    const batch = writeBatch(db);
    reorderSections(sections, from, to).forEach(({ id, order }) =>
      batch.update(doc(db, "sections", id), { order })
    );
    await batch.commit();
  };

  const handleItemDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const batch = writeBatch(db);
    reorderItems(items, source, destination, generalSectionId).forEach(({ id, ...fields }) =>
      batch.update(doc(db, "groceries", id), fields)
    );
    await batch.commit();
  };

  const toggleSearch = () =>
    setShowSearch((s) => {
      const next = !s;
      if (!next) setSearch("");
      return next;
    });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell
        header={
          <Header
            done={doneCount}
            total={items.length}
            remaining={items.length - doneCount}
            resetDisabled={resettableCount === 0}
            onReset={() => setResetOpen(true)}
            onSearch={toggleSearch}
            onAddSection={() => setAddSectionOpen(true)}
          />
        }
        compose={
          <ComposeBar
            value={newItem}
            qty={newQty}
            sections={sections}
            selectedSectionId={newSection}
            onChange={setNewItem}
            onQtyChange={setNewQty}
            onSelectSection={setNewSection}
            onSubmit={handleAdd}
          />
        }
      >
        {showSearch && (
          <Box sx={{ px: "16px", pt: "14px" }}>
            <InputBase
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              autoFocus
              sx={{
                width: "100%",
                height: 40,
                borderRadius: `${tokens.radius.pill}px`,
                bgcolor: tokens.color.composeField,
                px: "15px",
                fontSize: 14,
                color: tokens.color.ink,
                "& input::placeholder": { color: tokens.color.textTertiary, opacity: 1 },
              }}
            />
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: tokens.color.accent }} />
          </Box>
        ) : (
          <SectionList
            sections={sections}
            getItems={getItems}
            hasSearch={!!search}
            onItemDragEnd={handleItemDragEnd}
            onRenameSection={handleRenameSectionOpen}
            onDeleteSection={handleDeleteSection}
            onMoveSectionUp={(index) => handleReorderSection(index, index - 1)}
            onMoveSectionDown={(index) => handleReorderSection(index, index + 1)}
            onToggleItem={handleToggle}
            onTogglePinItem={handleTogglePin}
            onEditItem={handleEditOpen}
            onDeleteItem={handleDelete}
          />
        )}
      </AppShell>

      {/* Edit Item Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField label="Item" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth autoFocus />
          <TextField
            label="Details — brand, size, notes"
            value={editQty}
            onChange={(e) => setEditQty(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <FormControl fullWidth>
            <InputLabel>Section</InputLabel>
            <Select value={editSection} label="Section" onChange={(e) => setEditSection(e.target.value)}>
              {sections.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={!editName.trim()}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={addSectionOpen} onClose={() => setAddSectionOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Section</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <TextField label="Section name" value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSection()} fullWidth autoFocus placeholder="e.g. Produce, Dairy, Frozen…" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddSectionOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleAddSection} disabled={!newSectionName.trim()}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Rename Section Dialog */}
      <Dialog open={renameSectionOpen} onClose={() => setRenameSectionOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename Section</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <TextField label="Section name" value={renameSectionValue} onChange={(e) => setRenameSectionValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRenameSectionSave()} fullWidth autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRenameSectionOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleRenameSectionSave} disabled={!renameSectionValue.trim()}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset checked items?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will uncheck {resettableCount} completed item{resettableCount === 1 ? "" : "s"} for your next trip.
            Pinned items stay checked. Nothing is deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleReset} disabled={resettableCount === 0}>Reset</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ borderRadius: 3 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
