import { applyChanges, diffConfigs, previewValue, summarizeChanges } from "./diffUtils";

/** Shaped like a real config: mixed primitives, nested objects and lists. */
const CURRENT = {
  order: ["banner", "spotlight"],
  apiConfig: { otpV4Verify: { url: "/apis/otp/v4/verify", enabled: true } },
  seeAllTabsConfig: { forYou: { recentlyAdded: false } },
  legacyFlag: true,
};

const INCOMING = {
  order: ["banner", "spotlight", "trending"],            // list changed wholesale
  apiConfig: {
    otpV4Verify: { url: "/apis/otp/v4/verify", enabled: false }, // value differs
    otpV1Generate: { url: "/apis/otp/v1/generate", enabled: true }, // new attribute
  },
  seeAllTabsConfig: { forYou: { recentlyAdded: false } }, // identical
  nlwExperience: { banner: { enabled: true } },           // new branch
};

const key = (c: any) => c.pathKey;

describe("comparing two configurations", () => {
  const changes = diffConfigs(CURRENT, INCOMING);

  it("reports only the attributes that actually differ", () => {
    expect(changes.map(key).sort()).toEqual([
      "apiConfig.otpV1Generate",
      "apiConfig.otpV4Verify.enabled",
      "legacyFlag",
      "nlwExperience",
      "order",
    ]);
    // An identical branch produces nothing at all.
    expect(changes.map(key)).not.toContain("seeAllTabsConfig");
  });

  it("classifies each difference", () => {
    const byPath = Object.fromEntries(changes.map((c) => [c.pathKey, c.kind]));
    expect(byPath["apiConfig.otpV1Generate"]).toBe("added");
    expect(byPath["nlwExperience"]).toBe("added");
    expect(byPath["apiConfig.otpV4Verify.enabled"]).toBe("changed");
    expect(byPath["order"]).toBe("changed");
    expect(byPath["legacyFlag"]).toBe("removed");
    expect(summarizeChanges(changes)).toEqual({ added: 2, changed: 2, removed: 1 });
  });

  it("treats a list as a single change rather than one per index", () => {
    expect(changes.filter((c) => c.pathKey.startsWith("order"))).toHaveLength(1);
  });

  it("finds nothing between identical configurations", () => {
    expect(diffConfigs(CURRENT, JSON.parse(JSON.stringify(CURRENT)))).toEqual([]);
  });
});

describe("merging selected changes", () => {
  const changes = diffConfigs(CURRENT, INCOMING);
  const pick = (...paths: string[]) => applyChanges(CURRENT, changes, new Set(paths));

  it("brings across only what was ticked", () => {
    const merged = pick("apiConfig.otpV1Generate");
    expect(merged.apiConfig.otpV1Generate).toEqual(INCOMING.apiConfig.otpV1Generate);
    // Untouched differences stay as they were.
    expect(merged.apiConfig.otpV4Verify.enabled).toBe(true);
    expect(merged.order).toEqual(CURRENT.order);
    expect(merged.legacyFlag).toBe(true);
  });

  it("removes an attribute the pasted config no longer has", () => {
    const merged = pick("legacyFlag");
    expect("legacyFlag" in merged).toBe(false);
    expect(Object.keys(merged)).toEqual(["order", "apiConfig", "seeAllTabsConfig"]);
  });

  it("reproduces the pasted config when everything is selected", () => {
    const merged = applyChanges(CURRENT, changes, new Set(changes.map(key)));
    expect(merged).toEqual(INCOMING);
  });

  it("keeps key order and never mutates the original", () => {
    const snapshot = JSON.stringify(CURRENT);
    const merged = pick("apiConfig.otpV4Verify.enabled");
    // The edited key keeps its position rather than moving to the end.
    expect(Object.keys(merged.apiConfig.otpV4Verify)).toEqual(["url", "enabled"]);
    expect(Object.keys(merged)).toEqual(Object.keys(CURRENT));
    expect(JSON.stringify(CURRENT)).toBe(snapshot);
  });

  it("changes nothing when no differences are selected", () => {
    expect(applyChanges(CURRENT, changes, new Set())).toEqual(CURRENT);
  });
});

describe("value previews", () => {
  it("shows a dash for an absent side and truncates long values", () => {
    expect(previewValue(undefined)).toBe("—");
    expect(previewValue("short")).toBe("short");
    expect(previewValue("x".repeat(200)).endsWith("…")).toBe(true);
    expect(previewValue({ a: 1 })).toBe('{"a":1}');
  });
});
