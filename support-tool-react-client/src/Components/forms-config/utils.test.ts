import {
  EMPTY_FILTERS,
  collectFilterOptions,
  countActiveFilters,
  filterFormConfigRows,
  normalizeFormsConfigList,
} from "./utils";

/** Shaped like the real /formsConfig/v2/list payload. */
const LIST = {
  result: {
    formConfigurations: [
      { id: 9, name: "portal_page_profile", subType: "profile", type: "page", portal: "portal", clientVersion: 1 },
      { id: 27, name: "portal_page_home_v2", subType: "home", type: "page", portal: "portal", clientVersion: 2 },
      { id: 31, name: "mobile-page-home_Public_v2", subType: "home", type: "page", portal: "mobile", clientVersion: 2 },
      { id: 39, name: "mobile-page-theme-group1", subType: "theme", type: "page", portal: "mobile", clientVersion: 1 },
    ],
  },
};
const rows = normalizeFormsConfigList(LIST);
const withFilters = (patch: any) => filterFormConfigRows(rows, { ...EMPTY_FILTERS, ...patch });

describe("filter options", () => {
  it("lists each distinct value once, with how many rows use it", () => {
    const options = collectFilterOptions(rows);
    expect(options.portal).toEqual([
      { value: "mobile", count: 2 },
      { value: "portal", count: 2 },
    ]);
    expect(options.clientVersion).toEqual([
      { value: "1", count: 2 },
      { value: "2", count: 2 },
    ]);
    // A column with one value still collapses to a single option, not 4 duplicates.
    expect(options.type).toEqual([{ value: "page", count: 4 }]);
    expect(options.subType.map((o) => o.value)).toEqual(["home", "profile", "theme"]);
  });

  it("sorts client versions numerically, not as text", () => {
    const many = normalizeFormsConfigList({
      result: {
        formConfigurations: [2, 10, 1].map((v, i) => ({ id: i, name: `c${i}`, clientVersion: v })),
      },
    });
    expect(collectFilterOptions(many).clientVersion.map((o) => o.value)).toEqual(["1", "2", "10"]);
  });
});

describe("filter options react to the other filters", () => {
  it("recounts a column against the current selection", () => {
    // The reported problem: with portal=mobile chosen, Type must not still claim
    // the whole-list count.
    const all = collectFilterOptions(rows);
    expect(all.type).toEqual([{ value: "page", count: 4 }]);

    const withMobile = collectFilterOptions(rows, { ...EMPTY_FILTERS, portal: "mobile" });
    expect(withMobile.type).toEqual([{ value: "page", count: 2 }]);
    expect(withMobile.subType).toEqual([
      { value: "home", count: 1 },
      { value: "theme", count: 1 },
    ]);
  });

  it("leaves a column's own options unrestricted so the choice can be changed", () => {
    const withMobile = collectFilterOptions(rows, { ...EMPTY_FILTERS, portal: "mobile" });
    // "portal" is still offered even though mobile is selected.
    expect(withMobile.portal.map((o) => o.value)).toEqual(["mobile", "portal"]);
    expect(withMobile.portal).toEqual([
      { value: "mobile", count: 2 },
      { value: "portal", count: 2 },
    ]);
  });

  it("narrows further as filters stack up", () => {
    const stacked = collectFilterOptions(rows, {
      ...EMPTY_FILTERS,
      portal: "mobile",
      subType: "home",
    });
    expect(stacked.clientVersion).toEqual([{ value: "2", count: 1 }]);
  });

  it("keeps a selected value listed even when the others rule it out", () => {
    // profile only exists on portal, so with portal=mobile it yields nothing —
    // but it must stay in the list, or the control holds a value it cannot render.
    const options = collectFilterOptions(rows, {
      ...EMPTY_FILTERS,
      portal: "mobile",
      subType: "profile",
    });
    expect(options.subType).toContainEqual({ value: "profile", count: 0 });
  });

  it("counts against the search box as well", () => {
    const options = collectFilterOptions(rows, { ...EMPTY_FILTERS, search: "mobile-page" });
    expect(options.portal).toEqual([{ value: "mobile", count: 2 }]);
  });
});

describe("filtering rows", () => {
  it("matches the name as a substring", () => {
    expect(withFilters({ search: "mobile-page" }).map((r) => r.id)).toEqual([31, 39]);
  });

  it("matches an exact id without dragging in names containing the digits", () => {
    expect(withFilters({ search: "9" }).map((r) => r.id)).toEqual([9]);
  });

  it("narrows by a single dropdown", () => {
    expect(withFilters({ portal: "mobile" }).map((r) => r.id)).toEqual([31, 39]);
    expect(withFilters({ clientVersion: "2" }).map((r) => r.id)).toEqual([27, 31]);
  });

  it("combines dropdowns and search", () => {
    expect(withFilters({ portal: "mobile", clientVersion: "2" }).map((r) => r.id)).toEqual([31]);
    expect(withFilters({ subType: "home", search: "portal_" }).map((r) => r.id)).toEqual([27]);
  });

  it("returns everything when nothing is selected", () => {
    expect(withFilters({}).length).toBe(4);
  });

  it("counts how many filters are active", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...EMPTY_FILTERS, portal: "mobile", search: " x " })).toBe(2);
    // Whitespace alone is not a filter.
    expect(countActiveFilters({ ...EMPTY_FILTERS, search: "   " })).toBe(0);
  });
});
