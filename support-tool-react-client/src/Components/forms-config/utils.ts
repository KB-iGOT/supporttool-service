import { FormConfigDetail, FormConfigRow } from "./types";

const asText = (value: any): string =>
  value === null || value === undefined ? "" : String(value);

/**
 * Pulls the config list out of the /formsConfig/v2/list response.
 * The payload lives at `result.formConfigurations`; the other lookups are
 * defensive fallbacks so an upstream rename degrades instead of breaking.
 */
const extractList = (response: any): any[] => {
  const result = response?.result;

  if (Array.isArray(result?.formConfigurations)) return result.formConfigurations;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;
  if (Array.isArray(response)) return response;

  return [];
};

export const normalizeFormsConfigList = (response: any): FormConfigRow[] =>
  extractList(response).map((item, index) => {
    const id = item?.id ?? "";
    const name = asText(item?.name);
    const type = asText(item?.type);
    const subType = asText(item?.subType);
    const portal = asText(item?.portal);
    const clientVersion = item?.clientVersion ?? "";

    return {
      rowKey: `${asText(id) || "row"}-${name}-${index}`,
      id,
      name,
      type,
      subType,
      portal,
      clientVersion,
      searchIndex: [name, type, subType, portal, asText(clientVersion), asText(id)]
        .join(" ")
        .toLowerCase(),
      raw: item,
    };
  });

/**
 * Shapes the /formsConfig/v2/admin/read/{id} response.
 * The payload sits directly on `result` — the config blob under `result.data`.
 */
export const normalizeFormConfigDetail = (response: any): FormConfigDetail | null => {
  const result = response?.result;
  if (!result || typeof result !== "object") return null;

  return {
    data: result.data ?? {},
    criteria: result.criteria ?? null,
    name: asText(result.name),
    type: asText(result.type),
    subType: asText(result.subType),
    portal: asText(result.portal),
    clientVersion: result.clientVersion ?? "",
  };
};

export interface FormConfigFilters {
  /** Free text, matched against the name (and an exact id). */
  search: string;
  type: string;
  subType: string;
  portal: string;
  clientVersion: string;
}

export const EMPTY_FILTERS: FormConfigFilters = {
  search: "",
  type: "",
  subType: "",
  portal: "",
  clientVersion: "",
};

export type FilterColumn = "type" | "subType" | "portal" | "clientVersion";

export const FILTER_COLUMNS: { key: FilterColumn; label: string }[] = [
  { key: "portal", label: "Portal" },
  { key: "type", label: "Type" },
  { key: "subType", label: "Sub Type" },
  { key: "clientVersion", label: "Client Version" },
];

export interface FilterOption {
  value: string;
  count: number;
}

/**
 * Distinct values per filterable column, counted against the rows that match every
 * *other* active filter.
 *
 * Excluding a column from its own facet is what makes the dropdowns usable: with
 * portal=mobile selected, Type reads "page (22)" rather than the whole-list "page (38)",
 * yet every portal value stays selectable so the choice can still be changed.
 */
export const collectFilterOptions = (
  rows: FormConfigRow[],
  filters: FormConfigFilters = EMPTY_FILTERS
): Record<FilterColumn, FilterOption[]> => {
  const build = (key: FilterColumn): FilterOption[] => {
    const others = filterFormConfigRows(rows, { ...filters, [key]: "" });

    const counts = new Map<string, number>();
    others.forEach((row) => {
      const value = asText(row[key]);
      if (!value) return;
      counts.set(value, (counts.get(value) || 0) + 1);
    });

    // Keep whatever is selected in the list even when the other filters rule it out,
    // so the control never holds a value it cannot show — it just reads (0).
    const selected = filters[key];
    if (selected && !counts.has(selected)) counts.set(selected, 0);

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => {
        // Client versions are numeric, so compare them as numbers.
        const an = Number(a.value);
        const bn = Number(b.value);
        if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
        return a.value.localeCompare(b.value);
      });
  };

  return {
    portal: build("portal"),
    type: build("type"),
    subType: build("subType"),
    clientVersion: build("clientVersion"),
  };
};

export const filterFormConfigRows = (
  rows: FormConfigRow[],
  filters: FormConfigFilters
): FormConfigRow[] => {
  const query = filters.search.trim().toLowerCase();

  return rows.filter((row) => {
    // Substring on the name, plus an exact id so a known id can be typed straight in
    // without the digits also matching half the names.
    if (query && !row.name.toLowerCase().includes(query) && asText(row.id) !== query) {
      return false;
    }
    return FILTER_COLUMNS.every(({ key }) => {
      const selected = filters[key];
      return !selected || asText(row[key]) === selected;
    });
  });
};

export const countActiveFilters = (filters: FormConfigFilters): number =>
  FILTER_COLUMNS.filter(({ key }) => Boolean(filters[key])).length + (filters.search.trim() ? 1 : 0);
