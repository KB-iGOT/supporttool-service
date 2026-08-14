import {
  addKeyAtPath,
  appendArrayItem,
  collectEnumOptions,
  defaultValueFor,
  deriveItemLabel,
  duplicateArrayItem,
  getNodeKind,
  humanizeKey,
  moveArrayItem,
  removeAtPath,
  renameKeyAtPath,
  searchNodes,
  setAtPath,
} from "./nodeUtils";

/**
 * A form edit must never reshuffle or drop keys it did not touch — the edit screen's
 * dirty check and the server's audit diff are both order-sensitive.
 */
const CONFIG = {
  order: ["banner", "spotlight", "trending"],
  homeSection: [
    { header: "", sectionKey: "banner", displayType: "banner", addToAccordian: false },
    { header: "Trending", sectionKey: "trendingCourses", displayType: "cards", addToAccordian: true },
  ],
  seeAllTabsConfig: { forYou: { recentlyAdded: false, igotSpecializations: true } },
  enableLazyLoading: true,
};

describe("node kinds", () => {
  it("classifies every shape the configs contain", () => {
    expect(getNodeKind(true)).toBe("boolean");
    expect(getNodeKind(3)).toBe("number");
    expect(getNodeKind("x")).toBe("string");
    expect(getNodeKind({})).toBe("object");
    expect(getNodeKind([])).toBe("emptyArray");
    expect(getNodeKind(["a", "b"])).toBe("primitiveArray");
    expect(getNodeKind([{ a: 1 }])).toBe("objectArray");
    expect(getNodeKind(null)).toBe("null");
  });
});

describe("key order and immutability", () => {
  it("keeps sibling order when a middle key changes", () => {
    const next = setAtPath(CONFIG, ["homeSection", 0, "header"], "Banner");
    expect(Object.keys(next)).toEqual(Object.keys(CONFIG));
    expect(Object.keys(next.homeSection[0])).toEqual(Object.keys(CONFIG.homeSection[0]));
    expect(next.homeSection[0].header).toBe("Banner");
  });

  it("keeps sibling order when a key is removed", () => {
    const next = removeAtPath(CONFIG, ["seeAllTabsConfig"]);
    expect(Object.keys(next)).toEqual(["order", "homeSection", "enableLazyLoading"]);
  });

  it("appends added keys without disturbing existing ones", () => {
    const next = addKeyAtPath(CONFIG, [], "newFlag", false);
    expect(Object.keys(next)).toEqual([...Object.keys(CONFIG), "newFlag"]);
  });

  it("never mutates the input", () => {
    const snapshot = JSON.stringify(CONFIG);
    setAtPath(CONFIG, ["enableLazyLoading"], false);
    removeAtPath(CONFIG, ["order", 0]);
    appendArrayItem(CONFIG, ["order"], "extra");
    duplicateArrayItem(CONFIG, ["homeSection"], 0);
    expect(JSON.stringify(CONFIG)).toBe(snapshot);
  });

  it("round-trips unchanged when every leaf is rewritten with its own value", () => {
    const rewrite = (node: any, path: (string | number)[], root: any): any => {
      if (Array.isArray(node)) {
        return node.reduce((acc, item, i) => rewrite(item, [...path, i], acc), root);
      }
      if (node && typeof node === "object") {
        return Object.keys(node).reduce((acc, key) => rewrite(node[key], [...path, key], acc), root);
      }
      return setAtPath(root, path, node);
    };
    expect(JSON.stringify(rewrite(CONFIG, [], CONFIG))).toBe(JSON.stringify(CONFIG));
  });
});

describe("renaming a key", () => {
  it("keeps the renamed key in its original position", () => {
    const next = renameKeyAtPath(CONFIG, [], "homeSection", "sections");
    expect(Object.keys(next)).toEqual(["order", "sections", "seeAllTabsConfig", "enableLazyLoading"]);
    expect(next.sections).toEqual(CONFIG.homeSection);
  });

  it("refuses a rename that would collide or empty the key", () => {
    expect(renameKeyAtPath(CONFIG, [], "order", "enableLazyLoading")).toBe(CONFIG);
    expect(renameKeyAtPath(CONFIG, [], "order", "")).toBe(CONFIG);
  });
});

describe("new field defaults", () => {
  it("gives each list type a first entry of the right shape", () => {
    // An empty [] can't tell the renderer whether items are text or sections.
    expect(defaultValueFor("textList")).toEqual([""]);
    expect(getNodeKind(defaultValueFor("textList"))).toBe("primitiveArray");
    expect(defaultValueFor("sectionList")).toEqual([{}]);
    expect(getNodeKind(defaultValueFor("sectionList"))).toBe("objectArray");
  });
});

describe("list operations", () => {
  it("moves, duplicates and removes items", () => {
    expect(moveArrayItem(CONFIG, ["order"], 0, 2).order).toEqual(["spotlight", "trending", "banner"]);
    expect(removeAtPath(CONFIG, ["order", 1]).order).toEqual(["banner", "trending"]);

    const duplicated = duplicateArrayItem(CONFIG, ["homeSection"], 0);
    expect(duplicated.homeSection).toHaveLength(3);
    expect(duplicated.homeSection[1]).toEqual(CONFIG.homeSection[0]);
    // A deep copy, so editing the copy cannot alter the original item.
    expect(duplicated.homeSection[1]).not.toBe(CONFIG.homeSection[0]);
  });

  it("ignores out-of-range moves", () => {
    expect(moveArrayItem(CONFIG, ["order"], 0, -1)).toBe(CONFIG);
    expect(moveArrayItem(CONFIG, ["order"], 0, 99)).toBe(CONFIG);
  });
});

describe("inference", () => {
  it("suggests options only when a key varies", () => {
    const options = collectEnumOptions({
      a: { displayType: "banner" },
      b: { displayType: "cards" },
      c: { displayType: "banner" },
      d: { onlyEver: "same" },
    });
    expect(options.displayType).toEqual(["banner", "cards"]);
    expect(options.onlyEver).toBeUndefined();
  });

  it("labels list items by their content", () => {
    expect(deriveItemLabel({ header: "Trending", sectionKey: "x" }, 0)).toBe("Trending");
    expect(deriveItemLabel({ sectionKey: "banner" }, 0)).toBe("banner");
    expect(deriveItemLabel({}, 3)).toBe("Item 4");
  });

  it("humanizes key names", () => {
    expect(humanizeKey("sectionKey")).toBe("Section Key");
    expect(humanizeKey("max_cards_to_show")).toBe("Max cards to show");
    expect(humanizeKey("enableLazyLoading")).toBe("Enable Lazy Loading");
  });
});

describe("searching", () => {
  it("matches on field name and records the path to it", () => {
    const result = searchNodes(CONFIG, "trending");
    // The value "Trending" and the key value "trendingCourses" both matched.
    expect(result.matched.has("homeSection[1].header")).toBe(true);
    expect(result.matched.has("homeSection[1].sectionKey")).toBe(true);
    // Ancestors stay visible so the tree can open down to them.
    expect(result.visible.has("homeSection")).toBe(true);
    expect(result.visible.has("homeSection[1]")).toBe(true);
    // The sibling that did not match is not on the path.
    expect(result.visible.has("homeSection[0]")).toBe(false);
  });

  it("matches the readable label, not just the raw key", () => {
    // "addToAccordian" does not contain "add to"; "Add To Accordian" does.
    const result = searchNodes(CONFIG, "add to");
    expect(result.matched.has("homeSection[0].addToAccordian")).toBe(true);
  });

  it("matches values inside lists of text", () => {
    const result = searchNodes(CONFIG, "spotlight");
    expect(result.matched.has("order[1]")).toBe(true);
    expect(result.visible.has("order")).toBe(true);
  });

  it("ignores queries shorter than two characters", () => {
    expect(searchNodes(CONFIG, "a").count).toBe(0);
    expect(searchNodes(CONFIG, " ").count).toBe(0);
  });

  it("returns nothing for a query that matches no field", () => {
    const result = searchNodes(CONFIG, "zzzznope");
    expect(result.count).toBe(0);
    expect(result.visible.size).toBe(0);
  });
});
