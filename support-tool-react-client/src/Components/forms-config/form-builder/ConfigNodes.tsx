import React, { useState } from "react";
import { Box, Button, Chip, IconButton, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import {
  Add as AddIcon,
  ArrowDownward as ArrowDownIcon,
  ArrowUpward as ArrowUpIcon,
  ContentCopy as DuplicateIcon,
  DeleteOutline as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { PrimitiveField } from "./PrimitiveField";
import { FieldGroup } from "./FieldGroup";
import { KeyNameField } from "./KeyNameField";
import { AddFieldDialog, FIELD_TYPES } from "./AddFieldDialog";
import {
  NodePath,
  defaultValueFor,
  deriveItemLabel,
  getNodeKind,
  humanizeKey,
  pathToString,
} from "./nodeUtils";

/** Operations a node performs on the document, supplied by the root builder. */
export interface NodeActions {
  setValue: (path: NodePath, value: any) => void;
  removeValue: (path: NodePath) => void;
  addKey: (path: NodePath, key: string, kind: string) => void;
  renameKey: (path: NodePath, from: string, to: string) => void;
  moveItem: (path: NodePath, from: number, to: number) => void;
  duplicateItem: (path: NodePath, index: number) => void;
  appendItem: (path: NodePath, value: any) => void;
  isExpanded: (pathKey: string) => boolean;
  toggleExpanded: (pathKey: string) => void;
  enumOptions: Record<string, string[]>;
  /** When off, only values can be edited — no adding or deleting fields. */
  structureMode: boolean;
  /** A search is filtering the tree down to matching fields. */
  searchActive: boolean;
  /** On the path to a match, so it stays rendered and open. */
  isVisible: (pathKey: string) => boolean;
  /** Matched the query itself, so it is highlighted and shows all its children. */
  isMatch: (pathKey: string) => boolean;
}

interface NodeProps {
  label: string;
  fieldKey: string;
  value: any;
  path: NodePath;
  depth: number;
  actions: NodeActions;
  onRemove?: () => void;
  /** Item controls rendered in the section header (array items only). */
  headerExtras?: React.ReactNode;
  /** Keys of the object this node sits in, so a rename can reject duplicates. */
  siblings?: string[];
}

/**
 * A section's own key, editable in structure mode.
 * Array items are addressed by index, so only object properties can be renamed.
 */
const useSectionKeyEditor = (
  path: NodePath,
  actions: NodeActions,
  siblings?: string[]
): React.ReactNode => {
  const last = path[path.length - 1];
  if (!actions.structureMode || typeof last !== "string") return undefined;

  return (
    <KeyNameField
      value={last}
      siblings={siblings}
      ariaLabel={`Section name for ${last}`}
      onCommit={(next) => actions.renameKey(path.slice(0, -1), last, next)}
    />
  );
};

const INDENT_SX = {
  borderLeft: "2px solid",
  borderColor: "divider",
  pl: 2,
  ml: 0.5,
};

/** Collapsible container used for both object sections and array items. */
const Section: React.FC<{
  title: string;
  /** Replaces the title text with an editable key field. */
  titleEditor?: React.ReactNode;
  summary?: string;
  expanded: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, titleEditor, summary, expanded, onToggle, actions, children }) => (
  <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "background.paper" }}>
    {/* The toggle and the item controls are siblings — nesting buttons inside a
        button would break both semantics and keyboard navigation. */}
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.75 }}>
      {/* When the key is editable the toggle shrinks to the chevron alone — an input
          cannot live inside a button. */}
      <Box
        component="button"
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={titleEditor ? `Expand ${title}` : undefined}
        sx={{
          flex: titleEditor ? "0 0 auto" : 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 1,
          background: "none",
          border: 0,
          font: "inherit",
          color: "inherit",
          textAlign: "left",
          cursor: "pointer",
          borderRadius: 1,
          p: 0.25,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <ExpandMoreIcon
          fontSize="small"
          sx={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 120ms" }}
        />
        {!titleEditor && (
          <>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ flex: 1, minWidth: 0, wordBreak: "break-word" }}
            >
              {title}
            </Typography>
            {summary && (
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                {summary}
              </Typography>
            )}
          </>
        )}
      </Box>
      {titleEditor && <Box sx={{ flex: 1, minWidth: 0 }}>{titleEditor}</Box>}
      {titleEditor && summary && (
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {summary}
        </Typography>
      )}
      {actions && <Box sx={{ display: "flex", flexShrink: 0 }}>{actions}</Box>}
    </Box>
    {/* Children mount only while expanded — these documents reach 6,500 nodes. */}
    {expanded && <Box sx={{ px: 1.5, pb: 1.5, pt: 0.5 }}>{children}</Box>}
  </Box>
);

const ObjectNode: React.FC<NodeProps> = ({
  label,
  value,
  path,
  depth,
  actions,
  onRemove,
  headerExtras,
  siblings,
}) => {
  const [addOpen, setAddOpen] = useState(false);
  const titleEditor = useSectionKeyEditor(path, actions, siblings);
  const pathKey = pathToString(path);
  const expanded = actions.isExpanded(pathKey);
  // A node that matched shows everything it contains; an ancestor of a match is
  // narrowed to the branches that lead to one.
  const showAll = !actions.searchActive || actions.isMatch(pathKey);
  const keys = Object.keys(value || {}).filter(
    (k) => showAll || actions.isVisible(pathToString([...path, k]))
  );

  const primitives = keys.filter((k) => {
    const kind = getNodeKind(value[k]);
    return kind === "string" || kind === "number" || kind === "boolean";
  });
  const branches = keys.filter((k) => !primitives.includes(k));

  return (
    <>
      <Section
        title={label}
        titleEditor={titleEditor}
        summary={`${keys.length} ${keys.length === 1 ? "field" : "fields"}`}
        expanded={expanded}
        onToggle={() => actions.toggleExpanded(pathKey)}
        actions={
          <>
            {headerExtras}
            {onRemove && actions.structureMode && (
              <Tooltip title="Remove">
                <IconButton size="small" aria-label="Remove section" onClick={onRemove}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        }
      >
        <Box sx={{ ...(depth > 0 ? INDENT_SX : {}), display: "flex", flexDirection: "column", gap: 2 }}>
          {keys.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              This section is empty.
            </Typography>
          )}

          {primitives.length > 0 && (
            <FieldGroup
              value={value}
              keys={primitives}
              path={path}
              enumOptions={actions.enumOptions}
              structureMode={actions.structureMode}
              onChange={actions.setValue}
              onRemove={actions.removeValue}
              onRenameKey={actions.renameKey}
              isMatch={(key) => actions.isMatch(pathToString([...path, key]))}
            />
          )}

          {branches.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {branches.map((key) => (
                <ValueNode
                  key={key}
                  fieldKey={key}
                  label={humanizeKey(key)}
                  value={value[key]}
                  path={[...path, key]}
                  depth={depth + 1}
                  actions={actions}
                  siblings={Object.keys(value || {})}
                  onRemove={() => actions.removeValue([...path, key])}
                />
              ))}
            </Box>
          )}

          {actions.structureMode && !actions.searchActive && (
            <Box>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
                Add field
              </Button>
            </Box>
          )}
        </Box>
      </Section>

      <AddFieldDialog
        open={addOpen}
        sectionLabel={label}
        existingKeys={keys}
        onClose={() => setAddOpen(false)}
        onAdd={(key, kind) => actions.addKey(path, key, kind)}
      />
    </>
  );
};

const ObjectArrayNode: React.FC<NodeProps> = ({
  label,
  value,
  path,
  depth,
  actions,
  onRemove,
  siblings,
}) => {
  const titleEditor = useSectionKeyEditor(path, actions, siblings);
  const pathKey = pathToString(path);
  const expanded = actions.isExpanded(pathKey);
  const allItems: any[] = value;
  const showAll = !actions.searchActive || actions.isMatch(pathKey);
  const items = allItems
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => showAll || actions.isVisible(pathToString([...path, index])));

  return (
    <Section
      title={label}
      titleEditor={titleEditor}
      summary={`list · ${allItems.length} ${allItems.length === 1 ? "item" : "items"}`}
      expanded={expanded}
      onToggle={() => actions.toggleExpanded(pathKey)}
      actions={
        onRemove &&
        actions.structureMode && (
          <Tooltip title="Remove">
            <IconButton size="small" aria-label="Remove section" onClick={onRemove}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      }
    >
      <Box sx={{ ...INDENT_SX, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {items.map(({ item, index }) => (
          <ObjectNode
            key={`${pathKey}[${index}]`}
            fieldKey=""
            label={`${index + 1}. ${deriveItemLabel(item, index)}`}
            value={item}
            path={[...path, index]}
            depth={depth + 1}
            actions={actions}
            onRemove={() => actions.removeValue([...path, index])}
            headerExtras={
              <>
                <Tooltip title="Move up">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => actions.moveItem(path, index, index - 1)}
                    >
                      <ArrowUpIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move down">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Move down"
                      disabled={index === allItems.length - 1}
                      onClick={() => actions.moveItem(path, index, index + 1)}
                    >
                      <ArrowDownIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Duplicate — the safest way to add another">
                  <IconButton
                    size="small"
                    aria-label="Duplicate"
                    onClick={() => actions.duplicateItem(path, index)}
                  >
                    <DuplicateIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            }
          />
        ))}

        {!actions.searchActive && (
          <Box>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() =>
                allItems.length > 0
                  ? actions.duplicateItem(path, allItems.length - 1)
                  : actions.appendItem(path, {})
              }
            >
              {allItems.length > 0 ? "Add item (copies the last one)" : "Add item"}
            </Button>
          </Box>
        )}
      </Box>
    </Section>
  );
};

const PrimitiveArrayNode: React.FC<NodeProps> = ({
  label,
  fieldKey,
  value,
  path,
  actions,
  onRemove,
  siblings,
}) => {
  const titleEditor = useSectionKeyEditor(path, actions, siblings);
  const pathKey = pathToString(path);
  const expanded = actions.isExpanded(pathKey);
  const items: any[] = value;

  return (
    <Section
      title={label}
      titleEditor={titleEditor}
      summary={`list · ${items.length} ${items.length === 1 ? "value" : "values"}`}
      expanded={expanded}
      onToggle={() => actions.toggleExpanded(pathKey)}
      actions={
        onRemove &&
        actions.structureMode && (
          <Tooltip title="Remove">
            <IconButton size="small" aria-label="Remove section" onClick={onRemove}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      }
    >
      <Box sx={{ ...INDENT_SX, display: "flex", flexDirection: "column", gap: 1 }}>
        {items.map((item, index) => (
          <Box key={`${pathKey}[${index}]`} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Chip label={index + 1} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <PrimitiveField
                fieldKey={fieldKey}
                label=""
                value={item}
                options={actions.enumOptions[fieldKey]}
                onChange={(next) => actions.setValue([...path, index], next)}
              />
            </Box>
            <Tooltip title="Move up">
              <span>
                <IconButton
                  size="small"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => actions.moveItem(path, index, index - 1)}
                >
                  <ArrowUpIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton
                  size="small"
                  aria-label="Move down"
                  disabled={index === items.length - 1}
                  onClick={() => actions.moveItem(path, index, index + 1)}
                >
                  <ArrowDownIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {actions.structureMode && (
              <Tooltip title="Remove value">
                <IconButton
                  size="small"
                  aria-label="Remove value"
                  onClick={() => actions.removeValue([...path, index])}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ))}

        <Box>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => actions.appendItem(path, typeof items[0] === "number" ? 0 : "")}
          >
            Add value
          </Button>
        </Box>
      </Box>
    </Section>
  );
};

/** Empty array or null — offer to give the branch a shape. */
const UnsetNode: React.FC<NodeProps> = ({ label, value, path, actions, onRemove }) => {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const isEmptyList = Array.isArray(value);

  return (
    <Box
      sx={{
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 1,
        px: 1.5,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
      }}
    >
      <Typography variant="body2" fontWeight={600} sx={{ flex: 1, minWidth: 0 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {isEmptyList ? "empty list" : "no value"}
      </Typography>

      {isEmptyList ? (
        <>
          <Button size="small" onClick={() => actions.appendItem(path, "")}>
            Add text value
          </Button>
          <Button size="small" onClick={() => actions.appendItem(path, {})}>
            Add section
          </Button>
        </>
      ) : (
        <>
          <Button size="small" onClick={(e) => setAnchor(e.currentTarget)}>
            Set value
          </Button>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            {FIELD_TYPES.map((type) => (
              <MenuItem
                key={type.value}
                onClick={() => {
                  actions.setValue(path, defaultValueFor(type.value));
                  setAnchor(null);
                }}
              >
                {type.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {onRemove && actions.structureMode && (
        <Tooltip title="Remove">
          <IconButton size="small" aria-label="Remove field" onClick={onRemove}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

/** Picks the control for a node. Objects and arrays recurse back through here. */
export const ValueNode: React.FC<NodeProps> = (props) => {
  const kind = getNodeKind(props.value);

  switch (kind) {
    case "object":
      return <ObjectNode {...props} />;
    case "objectArray":
      return <ObjectArrayNode {...props} />;
    case "primitiveArray":
      return <PrimitiveArrayNode {...props} />;
    case "emptyArray":
    case "null":
      return <UnsetNode {...props} />;
    default:
      return (
        <PrimitiveField
          fieldKey={props.fieldKey}
          label={props.label}
          value={props.value}
          options={props.actions.enumOptions[props.fieldKey]}
          onChange={(next) => props.actions.setValue(props.path, next)}
          onRemove={props.actions.structureMode ? props.onRemove : undefined}
        />
      );
  }
};
