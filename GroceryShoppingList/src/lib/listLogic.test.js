import {
  splitLegacyName,
  filterItems,
  countDone,
  resettableItems,
  countResettable,
  getGeneralSectionId,
  getSectionItems,
  nextItemOrder,
  nextSectionOrder,
  reconcileSelectedSection,
  reorderSections,
  reorderItems,
} from "./listLogic";

describe("splitLegacyName", () => {
  it("leaves the item alone when qty is already present", () => {
    const name = "Granola; Purely Elizabeth brand"; // >28 chars, has a separator
    expect(splitLegacyName(name, "1 bag")).toEqual({ name, qty: "1 bag" });
    // whitespace-only qty still counts as empty and may split
    expect(splitLegacyName(name, "   ")).toEqual({
      name: "Granola",
      qty: "Purely Elizabeth brand",
    });
  });

  it("leaves short names alone even with a separator", () => {
    expect(splitLegacyName("Milk, 2%", "")).toEqual({ name: "Milk, 2%", qty: "" });
  });

  it("leaves long names alone when there is no separator", () => {
    const name = "Extra large organic free range eggs"; // 36 chars, no separator
    expect(splitLegacyName(name, "")).toEqual({ name, qty: "" });
  });

  it("leaves empty/missing names alone", () => {
    expect(splitLegacyName("", "")).toEqual({ name: "", qty: "" });
    expect(splitLegacyName(undefined, "")).toEqual({ name: undefined, qty: "" });
  });

  it("splits on the first semicolon", () => {
    expect(splitLegacyName("Granola; Purely Elizabeth brand", "")).toEqual({
      name: "Granola",
      qty: "Purely Elizabeth brand",
    });
  });

  it("splits on an em-dash separator", () => {
    expect(splitLegacyName("Sourdough loaf — the seeded bakery one", "")).toEqual({
      name: "Sourdough loaf",
      qty: "the seeded bakery one",
    });
  });

  it("splits on a comma", () => {
    expect(splitLegacyName("Whole wheat sandwich bread, thin sliced", "")).toEqual({
      name: "Whole wheat sandwich bread",
      qty: "thin sliced",
    });
  });

  it("prefers ';' over ',' regardless of position", () => {
    // comma appears first positionally, but ';' has priority
    expect(splitLegacyName("Cereal, granola; the good kind here", "")).toEqual({
      name: "Cereal, granola",
      qty: "the good kind here",
    });
  });

  it("trims whitespace on both sides of the split", () => {
    expect(splitLegacyName("Bananas ;   very ripe ones please", "")).toEqual({
      name: "Bananas",
      qty: "very ripe ones please",
    });
  });

  it("is idempotent — running twice equals running once", () => {
    const once = splitLegacyName("Granola; Purely Elizabeth brand", "");
    expect(splitLegacyName(once.name, once.qty)).toEqual(once);
  });
});

describe("filterItems", () => {
  const items = [
    { id: "a", name: "Milk" },
    { id: "b", name: "Almond milk" },
    { id: "c", name: "Bread" },
  ];

  it("matches case-insensitively on substring", () => {
    expect(filterItems(items, "milk").map((i) => i.id)).toEqual(["a", "b"]);
    expect(filterItems(items, "MI").map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("returns everything for an empty search", () => {
    expect(filterItems(items, "")).toHaveLength(3);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterItems(items, "zzz")).toEqual([]);
  });
});

describe("countDone", () => {
  it("counts checked items", () => {
    expect(
      countDone([{ checked: true }, { checked: false }, { checked: true }])
    ).toBe(2);
  });

  it("is 0 for an empty list", () => {
    expect(countDone([])).toBe(0);
  });
});

describe("resettableItems / countResettable", () => {
  const items = [
    { id: "a", checked: true, skipReset: false }, // resettable
    { id: "b", checked: true, skipReset: true }, // pinned -> excluded
    { id: "c", checked: false, skipReset: false }, // unchecked -> excluded
    { id: "d", checked: true }, // skipReset undefined -> resettable
  ];

  it("selects checked, non-pinned items only", () => {
    expect(resettableItems(items).map((i) => i.id)).toEqual(["a", "d"]);
  });

  it("counts them", () => {
    expect(countResettable(items)).toBe(2);
  });
});

describe("getGeneralSectionId", () => {
  it("prefers the section flagged isDefault", () => {
    expect(
      getGeneralSectionId([
        { id: "s1" },
        { id: "s2", isDefault: true },
        { id: "s3" },
      ])
    ).toBe("s2");
  });

  it("falls back to the first section when none is default", () => {
    expect(getGeneralSectionId([{ id: "s1" }, { id: "s2" }])).toBe("s1");
  });

  it("is undefined when there are no sections", () => {
    expect(getGeneralSectionId([])).toBeUndefined();
  });
});

describe("getSectionItems", () => {
  it("filters by section and sorts by order", () => {
    const items = [
      { id: "a", sectionId: "s1", order: 2 },
      { id: "b", sectionId: "s2", order: 0 },
      { id: "c", sectionId: "s1", order: 0 },
      { id: "d", sectionId: "s1", order: 1 },
    ];
    expect(getSectionItems(items, "s1", "gen").map((i) => i.id)).toEqual([
      "c",
      "d",
      "a",
    ]);
  });

  it("treats items with no sectionId as belonging to General", () => {
    const items = [
      { id: "a", order: 0 }, // no sectionId -> general
      { id: "b", sectionId: "s2", order: 0 },
    ];
    expect(getSectionItems(items, "gen", "gen").map((i) => i.id)).toEqual(["a"]);
  });

  it("keeps insertion order for equal `order` (stable sort)", () => {
    const items = [
      { id: "x", sectionId: "s1", order: 0 },
      { id: "y", sectionId: "s1", order: 0 },
      { id: "z", sectionId: "s1", order: 0 },
    ];
    expect(getSectionItems(items, "s1", "gen").map((i) => i.id)).toEqual([
      "x",
      "y",
      "z",
    ]);
  });

  it("treats missing order as 0", () => {
    const items = [
      { id: "a", sectionId: "s1", order: 1 },
      { id: "b", sectionId: "s1" }, // undefined -> 0, sorts first
    ];
    expect(getSectionItems(items, "s1", "gen").map((i) => i.id)).toEqual([
      "b",
      "a",
    ]);
  });

  it("sinks checked items below unchecked regardless of order", () => {
    const items = [
      { id: "a", sectionId: "s1", order: 0, checked: true, checkedAt: 100 },
      { id: "b", sectionId: "s1", order: 1, checked: false },
      { id: "c", sectionId: "s1", order: 2, checked: false },
    ];
    expect(getSectionItems(items, "s1", "gen").map((i) => i.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("orders checked items by checkedAt ascending (the order they were checked)", () => {
    const items = [
      { id: "a", sectionId: "s1", order: 0, checked: true, checkedAt: 300 },
      { id: "b", sectionId: "s1", order: 1, checked: true, checkedAt: 100 },
      { id: "c", sectionId: "s1", order: 2, checked: true, checkedAt: 200 },
    ];
    expect(getSectionItems(items, "s1", "gen").map((i) => i.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("clusters legacy checked items (no checkedAt) stably before newly-checked ones", () => {
    const items = [
      { id: "new", sectionId: "s1", order: 0, checked: true, checkedAt: 500 },
      { id: "legacy1", sectionId: "s1", order: 1, checked: true }, // no checkedAt -> 0
      { id: "legacy2", sectionId: "s1", order: 2, checked: true }, // no checkedAt -> 0
    ];
    expect(getSectionItems(items, "s1", "gen").map((i) => i.id)).toEqual([
      "legacy1",
      "legacy2",
      "new",
    ]);
  });

  it("keeps unchecked in manual order even when a checked item has an earlier checkedAt", () => {
    const items = [
      { id: "u2", sectionId: "s1", order: 5, checked: false },
      { id: "u1", sectionId: "s1", order: 1, checked: false },
      { id: "done", sectionId: "s1", order: 0, checked: true, checkedAt: 10 },
    ];
    expect(getSectionItems(items, "s1", "gen").map((i) => i.id)).toEqual([
      "u1",
      "u2",
      "done",
    ]);
  });
});

describe("nextItemOrder", () => {
  it("returns 0 for an empty section", () => {
    expect(nextItemOrder([], "s1", "gen")).toBe(0);
    expect(
      nextItemOrder([{ id: "a", sectionId: "s2", order: 5 }], "s1", "gen")
    ).toBe(0);
  });

  it("returns max order + 1", () => {
    const items = [
      { id: "a", sectionId: "s1", order: 0 },
      { id: "b", sectionId: "s1", order: 3 },
      { id: "c", sectionId: "s2", order: 9 },
    ];
    expect(nextItemOrder(items, "s1", "gen")).toBe(4);
  });

  it("treats missing orders as 0 (so a section of undefined orders yields 1)", () => {
    const items = [
      { id: "a", sectionId: "s1" },
      { id: "b", sectionId: "s1" },
    ];
    expect(nextItemOrder(items, "s1", "gen")).toBe(1);
  });

  it("counts fallback-to-general items", () => {
    const items = [{ id: "a", order: 2 }]; // no sectionId -> general
    expect(nextItemOrder(items, "gen", "gen")).toBe(3);
  });
});

describe("nextSectionOrder", () => {
  it("returns 0 when there are no sections", () => {
    expect(nextSectionOrder([])).toBe(0);
  });

  it("returns max order + 1", () => {
    expect(
      nextSectionOrder([{ order: 0 }, { order: 2 }, { order: 1 }])
    ).toBe(3);
  });
});

describe("reconcileSelectedSection", () => {
  const sections = [{ id: "s1" }, { id: "s2" }, { id: "s3" }];

  it("keeps the previous id when it still exists", () => {
    expect(reconcileSelectedSection("s2", sections)).toBe("s2");
  });

  it("falls back to the first id when the previous is gone", () => {
    expect(reconcileSelectedSection("deleted", sections)).toBe("s1");
  });
});

describe("reorderSections", () => {
  const sections = [{ id: "s1" }, { id: "s2" }, { id: "s3" }];

  it("reindexes order after moving an item down", () => {
    expect(reorderSections(sections, 0, 2)).toEqual([
      { id: "s2", order: 0 },
      { id: "s3", order: 1 },
      { id: "s1", order: 2 },
    ]);
  });

  it("reindexes order after moving an item up", () => {
    expect(reorderSections(sections, 2, 0)).toEqual([
      { id: "s3", order: 0 },
      { id: "s1", order: 1 },
      { id: "s2", order: 2 },
    ]);
  });

  it("is a content no-op when from === to (still returns full reindex)", () => {
    expect(reorderSections(sections, 1, 1).map((s) => s.id)).toEqual([
      "s1",
      "s2",
      "s3",
    ]);
  });
});

describe("reorderItems", () => {
  const items = [
    { id: "a", sectionId: "s1", order: 0 },
    { id: "b", sectionId: "s1", order: 1 },
    { id: "c", sectionId: "s1", order: 2 },
    { id: "d", sectionId: "s2", order: 0 },
    { id: "e", sectionId: "s2", order: 1 },
  ];

  it("reindexes within a section and stamps sectionId on every item", () => {
    // move 'a' (index 0) to index 2 within s1
    const out = reorderItems(
      items,
      { droppableId: "s1", index: 0 },
      { droppableId: "s1", index: 2 },
      "gen"
    );
    expect(out).toEqual([
      { id: "b", order: 0, sectionId: "s1" },
      { id: "c", order: 1, sectionId: "s1" },
      { id: "a", order: 2, sectionId: "s1" },
    ]);
  });

  it("moves an item across sections: source keeps no sectionId, dest gets sectionId", () => {
    // move 'b' (s1 index 1) into s2 at index 1
    const out = reorderItems(
      items,
      { droppableId: "s1", index: 1 },
      { droppableId: "s2", index: 1 },
      "gen"
    );

    const source = out.filter((d) => d.id === "a" || d.id === "c");
    const dest = out.filter((d) => ["b", "d", "e"].includes(d.id));

    // source descriptors: order only, NO sectionId key
    expect(source).toEqual([
      { id: "a", order: 0 },
      { id: "c", order: 1 },
    ]);
    source.forEach((d) => expect(d).not.toHaveProperty("sectionId"));

    // dest descriptors: reindexed with the moved item inserted at index 1
    expect(dest).toEqual([
      { id: "d", order: 0, sectionId: "s2" },
      { id: "b", order: 1, sectionId: "s2" },
      { id: "e", order: 2, sectionId: "s2" },
    ]);
  });

  it("does not mutate the input items array", () => {
    const snapshot = JSON.parse(JSON.stringify(items));
    reorderItems(
      items,
      { droppableId: "s1", index: 0 },
      { droppableId: "s2", index: 0 },
      "gen"
    );
    expect(items).toEqual(snapshot);
  });
});
