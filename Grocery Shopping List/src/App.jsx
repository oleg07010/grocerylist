import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, writeBatch, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import {
  Box, Container, Typography, TextField, IconButton, Checkbox,
  List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Chip, Divider, Tooltip, Paper, InputAdornment,
  CircularProgress, Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SearchIcon from "@mui/icons-material/Search";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2d6a4f" },
    secondary: { main: "#f4a261" },
    background: { default: "#f8f9f4", paper: "#ffffff" },
    success: { main: "#52b788" },
    error: { main: "#e63946" },
  },
  typography: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    h4: { fontWeight: 800, letterSpacing: "-0.5px" },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, borderRadius: 10 } } },
    MuiPaper: { styleOverrides: { root: { boxShadow: "0 2px 16px rgba(0,0,0,0.07)" } } },
  },
});

const DEFAULT_SECTION = "general";

export default function App() {
  const [items, setItems] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newSection, setNewSection] = useState(DEFAULT_SECTION);
  const [search, setSearch] = useState("");

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
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const qSections = query(collection(db, "sections"), orderBy("order", "asc"));
    const unsubSections = onSnapshot(qSections, async (snap) => {
      const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (fetched.length === 0) {
        // Seed the General section into Firebase on first load
        const ref = await addDoc(collection(db, "sections"), {
          name: "General",
          isDefault: true,
          order: 0,
        });
        const generalSection = { id: ref.id, name: "General", isDefault: true, order: 0 };
        setSections([generalSection]);
        setNewSection(ref.id);
      } else {
        setSections(fetched);
        setNewSection((prev) => {
          const ids = fetched.map((s) => s.id);
          return ids.includes(prev) ? prev : ids[0];
        });
      }
    });
    return () => { unsubItems(); unsubSections(); };
  }, []);

  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const doneCount = items.filter((i) => i.checked).length;
  // Find the real General section id from Firebase
  const generalSectionId = sections.find((s) => s.isDefault)?.id || sections[0]?.id;

  const getSectionItems = (sectionId) =>
    filtered
      .filter((i) => (i.sectionId || generalSectionId) === sectionId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleAdd = async () => {
    const name = newItem.trim();
    if (!name) return;
    const sectionItems = items.filter((i) => (i.sectionId || generalSectionId) === newSection);
    const maxOrder = sectionItems.length > 0 ? Math.max(...sectionItems.map((i) => i.order ?? 0)) : -1;
    await addDoc(collection(db, "groceries"), {
      name, qty: newQty.trim() || "", checked: false,
      sectionId: newSection, order: maxOrder + 1, createdAt: serverTimestamp(),
    });
    setNewItem(""); setNewQty("");
    showSnack(`"${name}" added!`);
  };

  const handleToggle = async (item) =>
    updateDoc(doc(db, "groceries", item.id), { checked: !item.checked });

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
    const checked = items.filter((i) => i.checked);
    const batch = writeBatch(db);
    checked.forEach((i) => batch.update(doc(db, "groceries", i.id), { checked: false }));
    await batch.commit();
    setResetOpen(false);
    showSnack(`${checked.length} item(s) unchecked — fresh start! 🛒`);
  };

  const handleAddSection = async () => {
    const name = newSectionName.trim();
    if (!name) return;
    const maxOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.order ?? 0)) : -1;
    await addDoc(collection(db, "sections"), { name, order: maxOrder + 1 });
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

  const handleDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === "SECTION") {
      const reordered = Array.from(sections);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      const batch = writeBatch(db);
      reordered.forEach((s, idx) => {
        batch.update(doc(db, "sections", s.id), { order: idx });
      });
      await batch.commit();
      return;
    }

    const sourceSectionId = source.droppableId;
    const destSectionId = destination.droppableId;
    const sourceItems = [...items]
      .filter((i) => (i.sectionId || generalSectionId) === sourceSectionId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const destItems = sourceSectionId === destSectionId ? sourceItems :
      [...items]
        .filter((i) => (i.sectionId || generalSectionId) === destSectionId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const [movedItem] = sourceItems.splice(source.index, 1);

    if (sourceSectionId === destSectionId) {
      sourceItems.splice(destination.index, 0, movedItem);
      const batch = writeBatch(db);
      sourceItems.forEach((item, idx) =>
        batch.update(doc(db, "groceries", item.id), { order: idx, sectionId: destSectionId })
      );
      await batch.commit();
    } else {
      destItems.splice(destination.index, 0, movedItem);
      const batch = writeBatch(db);
      sourceItems.forEach((item, idx) => batch.update(doc(db, "groceries", item.id), { order: idx }));
      destItems.forEach((item, idx) =>
        batch.update(doc(db, "groceries", item.id), { order: idx, sectionId: destSectionId })
      );
      await batch.commit();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", pb: 8, background: "linear-gradient(160deg, #e9f5ee 0%, #f8f9f4 50%)" }}>
        {/* Header */}
        <Box sx={{ color: "#fff", py: 4, px: 2, mb: 4, background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)" }}>
          <Container maxWidth="sm">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <ShoppingCartIcon sx={{ fontSize: 34 }} />
              <Typography variant="h4" sx={{ color: "#fff" }}>GrocerySync</Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.75, ml: 0.5 }}>
              Shared shopping list — updates in real time for everyone 🌿
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <Chip icon={<CheckCircleOutlineIcon />} label={`${doneCount} done`} size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }} />
              <Chip label={`${items.length - doneCount} remaining`} size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "#fff" }} />
            </Box>
          </Container>
        </Box>

        <Container maxWidth="sm">
          {/* Add Item */}
          <Paper sx={{ p: 2.5, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>Add Item</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <TextField label="Item name" value={newItem} onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()} size="small" sx={{ flex: 2, minWidth: 130 }} autoComplete="off" />
              <TextField label="Qty / note" value={newQty} onChange={(e) => setNewQty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()} size="small" placeholder="e.g. 2 lbs" sx={{ flex: 1, minWidth: 90 }} autoComplete="off" />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Section</InputLabel>
                <Select value={newSection} label="Section" onChange={(e) => setNewSection(e.target.value)}>
                  {sections.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} disabled={!newItem.trim()}>Add</Button>
            </Box>
          </Paper>

          {/* Toolbar */}
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <TextField placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)}
              size="small" sx={{ flex: 1, minWidth: 160 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment> }} />
            <Button variant="outlined" color="primary" startIcon={<CreateNewFolderIcon />}
              onClick={() => setAddSectionOpen(true)} size="small">Add Section</Button>
            <Tooltip title="Uncheck all items (reset for new week)">
              <span>
                <Button variant="outlined" color="secondary" startIcon={<RestartAltIcon />}
                  onClick={() => setResetOpen(true)} disabled={doneCount === 0} size="small">Reset</Button>
              </span>
            </Tooltip>
          </Box>

          {/* Sections + Items */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress color="primary" /></Box>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="all-sections" type="SECTION" direction="vertical">
                {(provided) => (
                  <Box ref={provided.innerRef} {...provided.droppableProps}>
                    {sections.map((section, sectionIndex) => {
                      const sectionItems = getSectionItems(section.id);
                      const isDefault = !!section.isDefault;
                      return (
                        <Draggable key={section.id} draggableId={`section-${section.id}`} index={sectionIndex}>
                          {(secProv, secSnap) => (
                            <Paper ref={secProv.innerRef} {...secProv.draggableProps}
                              sx={{ mb: 2, overflow: "hidden", boxShadow: secSnap.isDragging ? "0 8px 30px rgba(0,0,0,0.15)" : undefined, transition: "box-shadow 0.2s" }}>
                              {/* Section Header */}
                              <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.2, bgcolor: "primary.main", color: "#fff", gap: 1 }}>
                                <Box {...secProv.dragHandleProps} sx={{ display: "flex", alignItems: "center", cursor: "grab", opacity: 0.7, "&:hover": { opacity: 1 } }}>
                                  <DragIndicatorIcon fontSize="small" />
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
                                  {section.name}
                                  <Chip label={sectionItems.length} size="small"
                                    sx={{ ml: 1, height: 18, fontSize: 11, bgcolor: "rgba(255,255,255,0.25)", color: "#fff" }} />
                                </Typography>
                                <Tooltip title="Rename section">
                                  <IconButton size="small" sx={{ color: "rgba(255,255,255,0.8)" }} onClick={() => handleRenameSectionOpen(section)}>
                                    <DriveFileRenameOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {!isDefault && (
                                  <Tooltip title="Delete section (items move to General)">
                                    <IconButton size="small" sx={{ color: "rgba(255,255,255,0.8)" }} onClick={() => handleDeleteSection(section)}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>

                              {/* Items */}
                              <Droppable droppableId={section.id} type="ITEM">
                                {(dropProv, dropSnap) => (
                                  <List ref={dropProv.innerRef} {...dropProv.droppableProps} disablePadding
                                    sx={{ minHeight: 48, bgcolor: dropSnap.isDraggingOver ? "rgba(45,106,79,0.06)" : "transparent", transition: "background 0.2s" }}>
                                    {sectionItems.length === 0 && !dropSnap.isDraggingOver && (
                                      <Box sx={{ py: 2, textAlign: "center", color: "text.disabled" }}>
                                        <Typography variant="caption">{search ? "No matches" : "Drop items here or add one above"}</Typography>
                                      </Box>
                                    )}
                                    {sectionItems.map((item, index) => (
                                      <Draggable key={item.id} draggableId={item.id} index={index}>
                                        {(dragProv, dragSnap) => (
                                          <Box>
                                            {index > 0 && <Divider component="div" />}
                                            <ListItem ref={dragProv.innerRef} {...dragProv.draggableProps}
                                              sx={{ bgcolor: dragSnap.isDragging ? "rgba(45,106,79,0.08)" : "transparent", opacity: item.checked ? 0.55 : 1, "&:hover": { bgcolor: "action.hover" }, transition: "background 0.15s" }}>
                                              <Box {...dragProv.dragHandleProps}
                                                sx={{ display: "flex", alignItems: "center", mr: 0.5, color: "text.disabled", cursor: "grab", "&:hover": { color: "text.secondary" } }}>
                                                <DragIndicatorIcon fontSize="small" />
                                              </Box>
                                              <ListItemIcon sx={{ minWidth: 36 }}>
                                                <Checkbox edge="start" checked={!!item.checked} onChange={() => handleToggle(item)} color="success" size="small" />
                                              </ListItemIcon>
                                              <ListItemText
                                                primary={
                                                  <Typography sx={{ textDecoration: item.checked ? "line-through" : "none", fontWeight: 500, color: item.checked ? "text.disabled" : "text.primary", fontSize: "0.95rem" }}>
                                                    {item.name}
                                                  </Typography>
                                                }
                                                secondary={item.qty ? <Chip label={item.qty} size="small" variant="outlined" sx={{ mt: 0.3, height: 18, fontSize: 11 }} /> : null}
                                              />
                                              <ListItemSecondaryAction>
                                                <Tooltip title="Edit">
                                                  <IconButton size="small" onClick={() => handleEditOpen(item)} sx={{ mr: 0.5, color: "primary.main" }}>
                                                    <EditIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                  <IconButton size="small" onClick={() => handleDelete(item)} sx={{ color: "error.main" }}>
                                                    <DeleteIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              </ListItemSecondaryAction>
                                            </ListItem>
                                          </Box>
                                        )}
                                      </Draggable>
                                    ))}
                                    {dropProv.placeholder}
                                  </List>
                                )}
                              </Droppable>
                            </Paper>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </Container>

        {/* Edit Item Dialog */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
            <TextField label="Item name" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth autoFocus />
            <TextField label="Qty / note" value={editQty} onChange={(e) => setEditQty(e.target.value)} fullWidth />
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

        {/* Reset Confirm Dialog */}
        <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Reset checked items?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              This will uncheck all {doneCount} completed item(s) so you can reuse the list for a new shopping trip. Items won't be deleted.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setResetOpen(false)} color="inherit">Cancel</Button>
            <Button variant="contained" color="secondary" onClick={handleReset} startIcon={<RestartAltIcon />}>Yes, Reset</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ borderRadius: 3 }}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
