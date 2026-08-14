import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  UnfoldLess as CollapseIcon,
  UnfoldMore as ExpandIcon,
} from "@mui/icons-material";
import { useDebounce } from "../../../hooks/useDebounce";
import { NodeActions, ValueNode } from "./ConfigNodes";
import { AddFieldDialog } from "./AddFieldDialog";
import { FieldGroup } from "./FieldGroup";
import {
  NodePath,
  addKeyAtPath,
  appendArrayItem,
  MIN_SEARCH_LENGTH,
  collectBranchPaths,
  collectEnumOptions,
  defaultValueFor,
  duplicateArrayItem,
  getAtPath,
  getNodeKind,
  humanizeKey,
  moveArrayItem,
  pathToString,
  removeAtPath,
  renameKeyAtPath,
  searchNodes,
  setAtPath,
} from "./nodeUtils";

interface ConfigFormBuilderProps {
  /** The same draft object the JSON tab edits. */
  value: any;
  onChange: (next: any) => void;
}

export const ConfigFormBuilder: React.FC<ConfigFormBuilderProps> = ({ value, onChange }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addOpen, setAddOpen] = useState(false);
  // Off by default: editing values is safe, changing the shape is opt-in.
  const [structureMode, setStructureMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);

  // Dropdown suggestions are derived from the document itself, so they stay
  // correct for configs nobody has described in advance.
  const enumOptions = useMemo(() => collectEnumOptions(value), [value]);

  // Matching fields and the branches leading to them, so the tree can filter down
  // and open itself instead of the user hunting through collapsed sections.
  const search = useMemo(() => searchNodes(value, debouncedSearch), [value, debouncedSearch]);
  const searchActive = debouncedSearch.trim().length >= MIN_SEARCH_LENGTH;

  // Anything just added is opened, otherwise it lands inside a collapsed section
  // and looks like nothing happened.
  const expandPaths = useCallback((...pathKeys: string[]) => {
    setExpanded((prev) => {
      const next = { ...prev };
      pathKeys.forEach((pathKey) => {
        if (pathKey) next[pathKey] = true;
      });
      return next;
    });
  }, []);

  const actions: NodeActions = useMemo(
    () => ({
      setValue: (path: NodePath, next: any) => onChange(setAtPath(value, path, next)),
      removeValue: (path: NodePath) => onChange(removeAtPath(value, path)),
      addKey: (path: NodePath, key: string, kind: string) => {
        onChange(addKeyAtPath(value, path, key, defaultValueFor(kind)));
        expandPaths(pathToString(path), pathToString([...path, key]));
      },
      renameKey: (path: NodePath, from: string, to: string) =>
        onChange(renameKeyAtPath(value, path, from, to)),
      moveItem: (path: NodePath, from: number, to: number) =>
        onChange(moveArrayItem(value, path, from, to)),
      duplicateItem: (path: NodePath, index: number) => {
        onChange(duplicateArrayItem(value, path, index));
        expandPaths(pathToString([...path, index + 1]));
      },
      appendItem: (path: NodePath, item: any) => {
        const length = Array.isArray(getAtPath(value, path)) ? getAtPath(value, path).length : 0;
        onChange(appendArrayItem(value, path, item));
        expandPaths(pathToString(path), pathToString([...path, length]));
      },
      // While searching, anything on the path to a match is open by definition.
      isExpanded: (pathKey: string) =>
        searchActive ? search.visible.has(pathKey) : Boolean(expanded[pathKey]),
      toggleExpanded: (pathKey: string) =>
        setExpanded((prev) => ({ ...prev, [pathKey]: !prev[pathKey] })),
      enumOptions,
      structureMode,
      searchActive,
      isVisible: (pathKey: string) => search.visible.has(pathKey),
      isMatch: (pathKey: string) => search.matched.has(pathKey),
    }),
    [value, onChange, expanded, enumOptions, structureMode, expandPaths, search, searchActive]
  );

  const handleExpandAll = useCallback(() => {
    const all: Record<string, boolean> = {};
    collectBranchPaths(value).forEach((pathKey) => {
      all[pathKey] = true;
    });
    setExpanded(all);
  }, [value]);

  if (typeof value === "string") {
    return (
      <Alert severity="warning">
        The configuration is not valid JSON right now, so it cannot be shown as a form. Fix it on the
        JSON Editor tab and come back.
      </Alert>
    );
  }

  if (getNodeKind(value) !== "object") {
    return (
      <Alert severity="info">
        This configuration is not a set of fields at its top level, so it is best edited on the JSON
        Editor tab.
      </Alert>
    );
  }

  const keys = Object.keys(value).filter(
    (key) => !searchActive || search.visible.has(key)
  );
  const primitives = keys.filter((key) => {
    const kind = getNodeKind(value[key]);
    return kind === "string" || kind === "number" || kind === "boolean";
  });
  const branches = keys.filter((key) => !primitives.includes(key));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
        <TextField
          size="small"
          sx={{ flex: 1, minWidth: 220 }}
          placeholder="Search fields by name or value..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="disabled" />
              </InputAdornment>
            ),
            endAdornment: searchText ? (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Clear search" onClick={() => setSearchText("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
        <FormControlLabel
          sx={{ mr: 0 }}
          control={
            <Switch
              size="small"
              checked={structureMode}
              onChange={(e) => setStructureMode(e.target.checked)}
            />
          }
          label={<Typography variant="body2">Edit structure</Typography>}
        />
        <Button
          size="small"
          startIcon={<ExpandIcon />}
          onClick={handleExpandAll}
          disabled={searchActive}
        >
          Expand all
        </Button>
        <Button
          size="small"
          startIcon={<CollapseIcon />}
          onClick={() => setExpanded({})}
          disabled={searchActive}
        >
          Collapse all
        </Button>
      </Box>

      {searchActive && (
        <Typography variant="body2" color="text.secondary">
          {search.count === 0
            ? "No fields match your search."
            : `${search.count} matching ${search.count === 1 ? "field" : "fields"}, shown in place. Clear the search to edit the rest.`}
        </Typography>
      )}

      {structureMode && (
        <Alert severity="warning" onClose={() => setStructureMode(false)}>
          Structure editing is on. You can now add and delete fields — removing one the portal expects
          will break the page it controls.
        </Alert>
      )}

      {keys.length === 0 && (
        <Alert severity="info">
          This configuration has no fields yet. Turn on <strong>Edit structure</strong> to add the first one.
        </Alert>
      )}

      {primitives.length > 0 && (
        <FieldGroup
          value={value}
          keys={primitives}
          path={[]}
          enumOptions={enumOptions}
          structureMode={structureMode}
          onChange={actions.setValue}
          onRemove={actions.removeValue}
          onRenameKey={actions.renameKey}
          isMatch={(key) => search.matched.has(key)}
        />
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {branches.map((key) => (
          <ValueNode
            key={key}
            fieldKey={key}
            label={humanizeKey(key)}
            value={value[key]}
            path={[key]}
            depth={0}
            actions={actions}
            siblings={Object.keys(value)}
            onRemove={() => actions.removeValue([key])}
          />
        ))}
      </Box>

      {structureMode && !searchActive && (
        <Box>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Add top-level field
          </Button>
        </Box>
      )}

      <AddFieldDialog
        open={addOpen}
        sectionLabel="this configuration"
        existingKeys={keys}
        onClose={() => setAddOpen(false)}
        onAdd={(key, kind) => actions.addKey([], key, kind)}
      />
    </Box>
  );
};
