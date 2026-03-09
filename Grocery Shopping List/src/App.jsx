import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

import {
  Box,
  Container,
  Typography,
  TextField,
  IconButton,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Divider,
  Tooltip,
  Paper,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SearchIcon from "@mui/icons-material/Search";

// ─── Theme ───────────────────────────────────────────────────────────────────
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
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { boxShadow: "0 2px 16px rgba(0,0,0,0.07)" } },
    },
  },
});

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState("");
  const [search, setSearch] = useState("");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");

  // Reset confirm dialog
  const [resetOpen, setResetOpen] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  // ── Real-time listener ────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "groceries"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const doneCount = items.filter((i) => i.checked).length;

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    const name = newItem.trim();
    if (!name) return;
    await addDoc(collection(db, "groceries"), {
      name,
      qty: newQty.trim() || "",
      checked: false,
      createdAt: serverTimestamp(),
    });
    setNewItem("");
    setNewQty("");
    showSnack(`"${name}" added!`);
  };

  const handleToggle = async (item) => {
    await updateDoc(doc(db, "groceries", item.id), { checked: !item.checked });
  };

  const handleDelete = async (item) => {
    await deleteDoc(doc(db, "groceries", item.id));
    showSnack(`"${item.name}" removed`, "info");
  };

  const handleEditOpen = (item) => {
    setEditItem(item);
    setEditName(item.name);
    setEditQty(item.qty || "");
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editName.trim()) return;
    await updateDoc(doc(db, "groceries", editItem.id), {
      name: editName.trim(),
      qty: editQty.trim(),
    });
    setEditOpen(false);
    showSnack("Item updated!");
  };

  const handleReset = async () => {
    const checked = items.filter((i) => i.checked);
    const batch = writeBatch(db);
    checked.forEach((i) => batch.update(doc(db, "groceries", i.id), { checked: false }));
    await batch.commit();
    setResetOpen(false);
    showSnack(`${checked.length} item(s) unchecked — fresh start! 🛒`);
  };

  // ── Keyboard shortcut for add ─────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAdd();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          pb: 8,
          background: "linear-gradient(160deg, #e9f5ee 0%, #f8f9f4 50%)",
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "#fff",
            py: 4,
            px: 2,
            mb: 4,
            background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
          }}
        >
          <Container maxWidth="sm">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <ShoppingCartIcon sx={{ fontSize: 34 }} />
              <Typography variant="h4" sx={{ color: "#fff" }}>
                GrocerySync
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.75, ml: 0.5 }}>
              Shared shopping list — updates in real time for everyone 🌿
            </Typography>

            {/* Progress chips */}
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <Chip
                icon={<CheckCircleOutlineIcon />}
                label={`${doneCount} done`}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }}
              />
              <Chip
                label={`${items.length - doneCount} remaining`}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "#fff" }}
              />
            </Box>
          </Container>
        </Box>

        <Container maxWidth="sm">
          {/* ── Add Item ── */}
          <Paper sx={{ p: 2.5, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              Add Item
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <TextField
                label="Item name"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={handleKeyDown}
                size="small"
                sx={{ flex: 2, minWidth: 140 }}
                autoComplete="off"
              />
              <TextField
                label="Qty / note"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                onKeyDown={handleKeyDown}
                size="small"
                placeholder="e.g. 2 lbs"
                sx={{ flex: 1, minWidth: 100 }}
                autoComplete="off"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                disabled={!newItem.trim()}
                sx={{ whiteSpace: "nowrap" }}
              >
                Add
              </Button>
            </Box>
          </Paper>

          {/* ── List ── */}
          <Paper sx={{ mb: 3 }}>
            {/* Search + Reset bar */}
            <Box
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <TextField
                placeholder="Search items…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Tooltip title="Uncheck all items (reset for new week)">
                <span>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<RestartAltIcon />}
                    onClick={() => setResetOpen(true)}
                    disabled={doneCount === 0}
                    size="small"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    Reset
                  </Button>
                </span>
              </Tooltip>
            </Box>

            {/* Items */}
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : filtered.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center", color: "text.disabled" }}>
                <ShoppingCartIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                <Typography variant="body2">
                  {search ? "No items match your search" : "Your list is empty — add something!"}
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filtered.map((item, idx) => (
                  <Box key={item.id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem
                      sx={{
                        transition: "background 0.2s",
                        "&:hover": { bgcolor: "action.hover" },
                        opacity: item.checked ? 0.55 : 1,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Checkbox
                          edge="start"
                          checked={!!item.checked}
                          onChange={() => handleToggle(item)}
                          color="success"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              textDecoration: item.checked ? "line-through" : "none",
                              fontWeight: 500,
                              color: item.checked ? "text.disabled" : "text.primary",
                            }}
                          >
                            {item.name}
                          </Typography>
                        }
                        secondary={
                          item.qty ? (
                            <Chip
                              label={item.qty}
                              size="small"
                              variant="outlined"
                              sx={{ mt: 0.3, height: 20, fontSize: 11 }}
                            />
                          ) : null
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditOpen(item)}
                            sx={{ mr: 0.5, color: "primary.main" }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item)}
                            sx={{ color: "error.main" }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Container>

        {/* ── Edit Dialog ── */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
            <TextField
              label="Item name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Qty / note"
              value={editQty}
              onChange={(e) => setEditQty(e.target.value)}
              fullWidth
              placeholder="e.g. 2 lbs, organic"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button variant="contained" onClick={handleEditSave} disabled={!editName.trim()}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Reset Confirm Dialog ── */}
        <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Reset checked items?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              This will uncheck all {doneCount} completed item(s), so you can reuse the list for a
              new shopping trip. Items won't be deleted.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setResetOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button variant="contained" color="secondary" onClick={handleReset} startIcon={<RestartAltIcon />}>
              Yes, Reset
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ── */}
        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            severity={snack.severity}
            variant="filled"
            sx={{ borderRadius: 3 }}
          >
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
