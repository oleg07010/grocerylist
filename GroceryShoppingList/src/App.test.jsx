import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import App from "./App";

// ---- Firestore mock (jest hoists this above imports; only `mock*` names may be referenced) ----
const mockAddDoc = jest.fn(() => Promise.resolve({ id: "new-id" }));
const mockUpdateDoc = jest.fn(() => Promise.resolve());
const mockDeleteDoc = jest.fn(() => Promise.resolve());
const mockBatch = {
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn(() => Promise.resolve()),
};
const mockWriteBatch = jest.fn(() => mockBatch);
const mockCallbacks = {}; // { groceries: cb, sections: cb }

jest.mock("./firebase", () => ({ db: {} }));

jest.mock("firebase/firestore", () => ({
  collection: (_db, name) => name,
  query: (coll) => coll,
  orderBy: jest.fn(),
  doc: (_db, coll, id) => ({ coll, id }),
  serverTimestamp: () => "SERVER_TS",
  onSnapshot: (q, cb) => {
    mockCallbacks[q] = cb;
    return () => {};
  },
  addDoc: (...a) => mockAddDoc(...a),
  updateDoc: (...a) => mockUpdateDoc(...a),
  deleteDoc: (...a) => mockDeleteDoc(...a),
  writeBatch: (...a) => mockWriteBatch(...a),
}));

// Drag-and-drop renders via render props; passthrough shims keep jsdom happy.
jest.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) =>
    children({ innerRef: () => {}, droppableProps: {}, placeholder: null }, {}),
  Draggable: ({ children }) =>
    children({ innerRef: () => {}, draggableProps: {}, dragHandleProps: {} }, {}),
}));

const docOf = (obj) => ({ id: obj.id, data: () => obj });

const emit = async (collectionName, records) => {
  await act(async () => {
    mockCallbacks[collectionName]({ docs: records.map(docOf) });
  });
};

const SECTIONS = [{ id: "gen", name: "General", isDefault: true, order: 0 }];

/** Render <App/> and feed it canned sections + items (loading -> false). */
const renderApp = async (items, sections = SECTIONS) => {
  render(<App />);
  await emit("sections", sections); // non-empty -> skips the "seed General" path
  await emit("groceries", items); // sets loading = false, populates list
};

beforeEach(() => {
  mockAddDoc.mockClear();
  mockUpdateDoc.mockClear();
  mockDeleteDoc.mockClear();
  mockWriteBatch.mockClear();
  mockBatch.update.mockClear();
  mockBatch.delete.mockClear();
  mockBatch.commit.mockClear();
  Object.keys(mockCallbacks).forEach((k) => delete mockCallbacks[k]);
});

test("renders the header and items from Firestore", async () => {
  await renderApp([
    { id: "i1", name: "Milk", qty: "", checked: false, skipReset: false, sectionId: "gen", order: 0 },
    { id: "i2", name: "Bread", qty: "2", checked: false, skipReset: false, sectionId: "gen", order: 1 },
  ]);

  expect(screen.getByText("GrocerySync")).toBeInTheDocument();
  expect(screen.getByText("Milk")).toBeInTheDocument();
  expect(screen.getByText("Bread")).toBeInTheDocument();
});

test("adding an item writes to the groceries collection", async () => {
  await renderApp([]);

  fireEvent.change(screen.getByPlaceholderText("Add an item…"), {
    target: { value: "Eggs" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add item" }));

  await waitFor(() => expect(mockAddDoc).toHaveBeenCalledTimes(1));
  const [collectionRef, payload] = mockAddDoc.mock.calls[0];
  expect(collectionRef).toBe("groceries");
  expect(payload).toMatchObject({
    name: "Eggs",
    checked: false,
    skipReset: false,
    sectionId: "gen", // reconciled from the loaded sections
    order: 0,
  });
});

test("toggling an item records checked + checkedAt", async () => {
  await renderApp([
    { id: "i1", name: "Milk", qty: "", checked: false, skipReset: false, sectionId: "gen", order: 0 },
  ]);

  fireEvent.click(screen.getByRole("checkbox"));

  await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalledTimes(1));
  expect(mockUpdateDoc).toHaveBeenCalledWith(
    { coll: "groceries", id: "i1" },
    { checked: true, checkedAt: expect.any(Number) }
  );
});

test("deleting an item (via the ⋯ menu) removes it from the groceries collection", async () => {
  await renderApp([
    { id: "i1", name: "Milk", qty: "", checked: false, skipReset: false, sectionId: "gen", order: 0 },
  ]);

  // Delete now lives inside the per-row overflow menu, not on the row itself.
  fireEvent.click(screen.getByRole("button", { name: "Item options" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));

  await waitFor(() => expect(mockDeleteDoc).toHaveBeenCalledTimes(1));
  expect(mockDeleteDoc).toHaveBeenCalledWith({ coll: "groceries", id: "i1" });
});

test("splits a legacy packed name into a title and details for display", async () => {
  await renderApp([
    {
      id: "i1",
      name: "Granola; Purely Elizabeth brand",
      qty: "",
      checked: false,
      skipReset: false,
      sectionId: "gen",
      order: 0,
    },
  ]);

  expect(screen.getByText("Granola")).toBeInTheDocument();
  expect(screen.getByText("Purely Elizabeth brand")).toBeInTheDocument();
});

test("reset button is disabled when every checked item is pinned", async () => {
  await renderApp([
    { id: "i1", name: "Milk", qty: "", checked: true, skipReset: true, sectionId: "gen", order: 0 }, // pinned
    { id: "i2", name: "Bread", qty: "", checked: false, skipReset: false, sectionId: "gen", order: 1 }, // unchecked
  ]);

  expect(screen.getByRole("button", { name: "Reset list" })).toBeDisabled();
});

test("reset button is enabled when a checked, unpinned item exists", async () => {
  await renderApp([
    { id: "i1", name: "Milk", qty: "", checked: true, skipReset: false, sectionId: "gen", order: 0 },
  ]);

  expect(screen.getByRole("button", { name: "Reset list" })).toBeEnabled();
});

test("search filters the visible items", async () => {
  await renderApp([
    { id: "i1", name: "Milk", qty: "", checked: false, skipReset: false, sectionId: "gen", order: 0 },
    { id: "i2", name: "Bread", qty: "", checked: false, skipReset: false, sectionId: "gen", order: 1 },
  ]);

  // Search is revealed by the header search button.
  fireEvent.click(screen.getByRole("button", { name: "Search items" }));
  fireEvent.change(screen.getByPlaceholderText("Search items…"), {
    target: { value: "milk" },
  });

  expect(screen.getByText("Milk")).toBeInTheDocument();
  expect(screen.queryByText("Bread")).not.toBeInTheDocument();
});
