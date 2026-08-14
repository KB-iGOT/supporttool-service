/**
 * Pure helpers behind the Form Fields tab.
 *
 * Every mutation returns a new value and preserves key order — the edit screen's
 * dirty check and the server's audit diff are both order-sensitive, so a form edit
 * must never silently reshuffle keys it did not touch.
 */

export type NodeKind =
  | "boolean"
  | "number"
  | "string"
  | "object"
  | "objectArray"
  | "primitiveArray"
  | "emptyArray"
  | "null";

export type NodePath = (string | number)[];

export const getNodeKind = (value: any): NodeKind => {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "emptyArray";
    const objects = value.filter((v) => v && typeof v === "object" && !Array.isArray(v)).length;
    return objects === value.length ? "objectArray" : "primitiveArray";
  }
  if (typeof value === "object") return "object";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
};

/** camelCase / snake_case / kebab-case -> "Camel Case". Falls back to the raw key. */
export const humanizeKey = (key: string): string => {
  if (!key) return "";
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
  if (!spaced) return key;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/** Identifiers the portal reads by name — editable, but locked until deliberately unlocked. */
const LOCKED_KEYS = new Set([
  "key",
  "sectionKey",
  "pillKey",
  "id",
  "identifier",
  "dataKey",
  "apiDetailsKey",
]);
export const isLockedKey = (key: string): boolean => LOCKED_KEYS.has(key);

export const isUrlKey = (key: string): boolean =>
  /(^|[a-z])url$|^url$|^path$|link$|^redirectUrl$|^routerLink$/i.test(key);

export const isImageKey = (key: string): boolean =>
  /icon|image|banner|logo|photo|thumbnail/i.test(key);

export const looksLikeImageUrl = (value: string): boolean =>
  /^(https?:\/\/|\/|assets\/)/i.test(value) && /\.(png|jpe?g|svg|gif|webp)(\?|$)/i.test(value);

/** Header text for one item of an object array, so cards read as content not "Item 3". */
export const deriveItemLabel = (item: any, index: number): string => {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const candidates = [
      "name",
      "title",
      "label",
      "header",
      "pillLabel",
      "categoryName",
      "sectionKey",
      "pillKey",
      "key",
      "clientName",
    ];
    for (const candidate of candidates) {
      const value = item[candidate];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  if (typeof item === "string" && item.trim()) return item.trim();
  return `Item ${index + 1}`;
};

export const pathToString = (path: NodePath): string =>
  path.reduce<string>(
    (acc, segment) =>
      typeof segment === "number" ? `${acc}[${segment}]` : acc ? `${acc}.${segment}` : String(segment),
    ""
  );

export const getAtPath = (root: any, path: NodePath): any =>
  path.reduce((node, segment) => (node === null || node === undefined ? node : node[segment]), root);

/** Shallow copy that keeps key order (spread preserves insertion order). */
const copyNode = (node: any): any => (Array.isArray(node) ? node.slice() : { ...node });

export const setAtPath = (root: any, path: NodePath, value: any): any => {
  if (path.length === 0) return value;

  const [head, ...rest] = path;
  const clone = copyNode(root ?? (typeof head === "number" ? [] : {}));
  clone[head] = rest.length === 0 ? value : setAtPath(clone[head], rest, value);
  return clone;
};

export const removeAtPath = (root: any, path: NodePath): any => {
  if (path.length === 0) return root;

  const [head, ...rest] = path;
  if (root === null || root === undefined) return root;

  if (rest.length > 0) {
    const clone = copyNode(root);
    clone[head] = removeAtPath(clone[head], rest);
    return clone;
  }

  if (Array.isArray(root)) {
    const clone = root.slice();
    clone.splice(Number(head), 1);
    return clone;
  }

  // Rebuild the object in its original key order, minus the removed key.
  const next: Record<string, any> = {};
  Object.keys(root).forEach((key) => {
    if (key !== String(head)) next[key] = root[key];
  });
  return next;
};

/** Appends a new key to the object at `path`. Existing keys keep their positions. */
export const addKeyAtPath = (root: any, path: NodePath, key: string, value: any): any => {
  const target = path.length === 0 ? root : getAtPath(root, path);
  const base = target && typeof target === "object" && !Array.isArray(target) ? target : {};
  return setAtPath(root, path, { ...base, [key]: value });
};

/** Renames a key in place — the replacement keeps the original key's position. */
export const renameKeyAtPath = (root: any, path: NodePath, from: string, to: string): any => {
  const target = path.length === 0 ? root : getAtPath(root, path);
  if (!target || typeof target !== "object" || Array.isArray(target)) return root;
  if (from === to || !to || Object.prototype.hasOwnProperty.call(target, to)) return root;

  const next: Record<string, any> = {};
  Object.keys(target).forEach((key) => {
    next[key === from ? to : key] = target[key];
  });
  return setAtPath(root, path, next);
};

export const moveArrayItem = (root: any, path: NodePath, from: number, to: number): any => {
  const list = getAtPath(root, path);
  if (!Array.isArray(list) || to < 0 || to >= list.length || from === to) return root;

  const clone = list.slice();
  const [moved] = clone.splice(from, 1);
  clone.splice(to, 0, moved);
  return setAtPath(root, path, clone);
};

export const duplicateArrayItem = (root: any, path: NodePath, index: number): any => {
  const list = getAtPath(root, path);
  if (!Array.isArray(list) || index < 0 || index >= list.length) return root;

  const clone = list.slice();
  clone.splice(index + 1, 0, JSON.parse(JSON.stringify(list[index])));
  return setAtPath(root, path, clone);
};

export const appendArrayItem = (root: any, path: NodePath, value: any): any => {
  const list = getAtPath(root, path);
  const base = Array.isArray(list) ? list : [];
  return setAtPath(root, path, [...base, value]);
};

/** A blank value for each type offered by "Add field" / "Set value". */
export const defaultValueFor = (kind: string): any => {
  switch (kind) {
    case "boolean":
      return false;
    case "number":
      return 0;
    case "object":
      return {};
    case "array":
      return [];
    // Lists start with one entry so the list already has its item type and the
    // first row is visible immediately.
    case "textList":
      return [""];
    case "sectionList":
      return [{}];
    default:
      return "";
  }
};

const ENUM_MIN_OCCURRENCES = 3;
const ENUM_MAX_DISTINCT = 12;

/**
 * Infers dropdown options by collecting the distinct string values each key takes
 * across the whole document — `displayType`, `cardType`, `visibilityMode` and friends
 * repeat enough to suggest their own option lists.
 */
export const collectEnumOptions = (root: any): Record<string, string[]> => {
  const seen: Record<string, Map<string, number>> = {};

  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    Object.entries(node).forEach(([key, value]) => {
      if (typeof value === "string" && value.length > 0 && value.length <= 60) {
        if (!seen[key]) seen[key] = new Map();
        seen[key].set(value, (seen[key].get(value) || 0) + 1);
      } else {
        walk(value);
      }
    });
  };
  walk(root);

  const options: Record<string, string[]> = {};
  Object.entries(seen).forEach(([key, values]) => {
    const total = Array.from(values.values()).reduce((a, b) => a + b, 0);
    if (values.size >= 2 && values.size <= ENUM_MAX_DISTINCT && total >= ENUM_MIN_OCCURRENCES) {
      options[key] = Array.from(values.keys()).sort((a, b) => a.localeCompare(b));
    }
  });
  return options;
};

export interface SearchResult {
  /** Paths of nodes that matched, by field name or by value. */
  matched: Set<string>;
  /** Matched paths plus every ancestor, so the tree can be filtered down to them. */
  visible: Set<string>;
  count: number;
}

export const EMPTY_SEARCH: SearchResult = {
  matched: new Set(),
  visible: new Set(),
  count: 0,
};

/** Single characters match nearly everything, which is noise rather than a search. */
export const MIN_SEARCH_LENGTH = 2;

/**
 * Finds every field whose name or value contains the query.
 *
 * Only matches and their ancestors are recorded. A matching node's own children are
 * deliberately not walked into `visible` — the renderer shows all children of a match
 * — which keeps this linear in the size of the document.
 */
export const searchNodes = (root: any, rawQuery: string): SearchResult => {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < MIN_SEARCH_LENGTH) return EMPTY_SEARCH;

  const matched = new Set<string>();
  const visible = new Set<string>();
  const contains = (text: string) => text.toLowerCase().includes(query);

  const walk = (node: any, path: NodePath, keyName: string): boolean => {
    const pathKey = pathToString(path);

    const nameMatches = Boolean(keyName) && (contains(keyName) || contains(humanizeKey(keyName)));
    const isLeaf = node === null || typeof node !== "object";
    const valueMatches = isLeaf && contains(String(node ?? ""));

    let childMatched = false;
    if (Array.isArray(node)) {
      node.forEach((item, index) => {
        if (walk(item, [...path, index], "")) childMatched = true;
      });
    } else if (node && typeof node === "object") {
      Object.keys(node).forEach((key) => {
        if (walk(node[key], [...path, key], key)) childMatched = true;
      });
    }

    const selfMatched = nameMatches || valueMatches;
    if (selfMatched) matched.add(pathKey);
    if (selfMatched || childMatched) {
      visible.add(pathKey);
      return true;
    }
    return false;
  };

  walk(root, [], "");
  return { matched, visible, count: matched.size };
};

/** Every object/array path in the tree, used by expand-all. */
export const collectBranchPaths = (root: any, path: NodePath = []): string[] => {
  const kind = getNodeKind(root);
  if (kind !== "object" && kind !== "objectArray" && kind !== "primitiveArray") return [];

  const here = path.length ? [pathToString(path)] : [];
  if (Array.isArray(root)) {
    return here.concat(root.flatMap((item, i) => collectBranchPaths(item, [...path, i])));
  }
  return here.concat(
    Object.entries(root).flatMap(([key, value]) => collectBranchPaths(value, [...path, key]))
  );
};
