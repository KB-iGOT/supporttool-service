import { NodePath, pathToString, removeAtPath, setAtPath } from "../form-builder/nodeUtils";

export type ChangeKind = "added" | "removed" | "changed";

export interface ConfigChange {
  path: NodePath;
  /** Dotted path, used as the selection key and shown in the list. */
  pathKey: string;
  kind: ChangeKind;
  /** Value in the config being edited; absent for an addition. */
  current?: any;
  /** Value in the pasted config; absent for a removal. */
  incoming?: any;
}

const isPlainObject = (value: any): boolean =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Compares two configurations attribute by attribute.
 *
 * Recursion stops at anything that is not a plain object, so a list counts as one
 * change rather than a change per index. Merging index-level edits into a list that
 * has also been reordered elsewhere silently corrupts it, and the interesting
 * differences between environments are almost always whole attributes.
 */
export const diffConfigs = (current: any, incoming: any): ConfigChange[] => {
  const changes: ConfigChange[] = [];

  const walk = (a: any, b: any, path: NodePath) => {
    if (isPlainObject(a) && isPlainObject(b)) {
      const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
      keys.forEach((key) => {
        const nextPath = [...path, key];
        const inCurrent = Object.prototype.hasOwnProperty.call(a, key);
        const inIncoming = Object.prototype.hasOwnProperty.call(b, key);

        if (!inCurrent && inIncoming) {
          changes.push({
            path: nextPath,
            pathKey: pathToString(nextPath),
            kind: "added",
            incoming: b[key],
          });
          return;
        }
        if (inCurrent && !inIncoming) {
          changes.push({
            path: nextPath,
            pathKey: pathToString(nextPath),
            kind: "removed",
            current: a[key],
          });
          return;
        }
        walk(a[key], b[key], nextPath);
      });
      return;
    }

    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes.push({
        path,
        pathKey: pathToString(path),
        kind: "changed",
        current: a,
        incoming: b,
      });
    }
  };

  walk(current, incoming, []);
  return changes;
};

/**
 * Applies the selected changes onto the current config.
 * Uses the same order-preserving helpers as the form builder, so untouched keys keep
 * their positions and the audit diff stays free of phantom changes.
 */
export const applyChanges = (
  current: any,
  changes: ConfigChange[],
  selected: Set<string>
): any =>
  changes
    .filter((change) => selected.has(change.pathKey))
    .reduce(
      (result, change) =>
        change.kind === "removed"
          ? removeAtPath(result, change.path)
          : setAtPath(result, change.path, change.incoming),
      current
    );

export const summarizeChanges = (changes: ConfigChange[]): Record<ChangeKind, number> => ({
  added: changes.filter((c) => c.kind === "added").length,
  changed: changes.filter((c) => c.kind === "changed").length,
  removed: changes.filter((c) => c.kind === "removed").length,
});

/** Compact one-line preview of a value for the comparison table. */
export const previewValue = (value: any, limit = 90): string => {
  if (value === undefined) return "—";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (text === undefined) return "—";
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
};

export const CHANGE_LABELS: Record<ChangeKind, string> = {
  added: "Only in pasted",
  changed: "Different",
  removed: "Only in current",
};
