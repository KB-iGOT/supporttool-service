import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { PrimitiveField } from "./PrimitiveField";
import { KeyNameField } from "./KeyNameField";
import { NodePath, humanizeKey } from "./nodeUtils";

interface FieldGroupProps {
  /** The object whose primitive keys are rendered. */
  value: Record<string, any>;
  keys: string[];
  path: NodePath;
  enumOptions: Record<string, string[]>;
  structureMode: boolean;
  onChange: (path: NodePath, value: any) => void;
  onRemove: (path: NodePath) => void;
  onRenameKey: (path: NodePath, from: string, to: string) => void;
  /** Highlights the rows a search matched. */
  isMatch?: (key: string) => boolean;
}

/**
 * One property per row: the key on the left, its value on the right.
 * Packing two unrelated properties into a single row made it hard to tell which
 * label belonged to which control, so rows are deliberately single-property.
 */
export const FieldGroup: React.FC<FieldGroupProps> = ({
  value,
  keys,
  path,
  enumOptions,
  structureMode,
  onChange,
  onRemove,
  onRenameKey,
  isMatch,
}) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1,
      overflow: "hidden",
    }}
  >
    {keys.map((key, index) => (
      <Box
        key={key}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "minmax(140px, 30%) 1fr" },
          alignItems: "center",
          columnGap: 2,
          rowGap: 0.5,
          px: 1.5,
          py: 1,
          borderTop: index > 0 ? "1px solid" : 0,
          borderColor: "divider",
          bgcolor: isMatch?.(key) ? "warning.light" : undefined,
          "&:hover": { bgcolor: isMatch?.(key) ? "warning.light" : "action.hover" },
        }}
      >
        {structureMode ? (
          <KeyNameField
            value={key}
            siblings={Object.keys(value)}
            ariaLabel={`Field name for ${key}`}
            onCommit={(next) => onRenameKey(path, key, next)}
          />
        ) : (
          <Tooltip title={key} placement="top-start">
            <Typography variant="body2" fontWeight={500} sx={{ wordBreak: "break-word" }}>
              {humanizeKey(key)}
            </Typography>
          </Tooltip>
        )}

        <PrimitiveField
          fieldKey={key}
          // The row already names the field, so the control itself stays unlabelled.
          label=""
          value={value[key]}
          options={enumOptions[key]}
          onChange={(next) => onChange([...path, key], next)}
          onRemove={structureMode ? () => onRemove([...path, key]) : undefined}
        />
      </Box>
    ))}
  </Box>
);
