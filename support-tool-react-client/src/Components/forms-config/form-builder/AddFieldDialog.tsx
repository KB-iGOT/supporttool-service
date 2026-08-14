import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";

/**
 * The two list kinds are offered separately — "List" on its own left people with an
 * empty array that then guessed the wrong item type on the first Add.
 */
export const FIELD_TYPES = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "On / Off" },
  { value: "object", label: "Section (group of fields)" },
  { value: "textList", label: "List of text values" },
  { value: "sectionList", label: "List of sections" },
];

interface AddFieldDialogProps {
  open: boolean;
  /** Section the field is added to, shown for context. */
  sectionLabel: string;
  /** Keys already present, to block duplicates. */
  existingKeys: string[];
  onClose: () => void;
  onAdd: (key: string, kind: string) => void;
}

export const AddFieldDialog: React.FC<AddFieldDialogProps> = ({
  open,
  sectionLabel,
  existingKeys,
  onClose,
  onAdd,
}) => {
  const [key, setKey] = useState("");
  const [kind, setKind] = useState("string");

  useEffect(() => {
    if (open) {
      setKey("");
      setKind("string");
    }
  }, [open]);

  const trimmed = key.trim();
  const duplicate = existingKeys.includes(trimmed);
  const valid = trimmed.length > 0 && !duplicate;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add a field to {sectionLabel}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Field name"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            error={duplicate}
            helperText={
              duplicate
                ? "This section already has a field with that name."
                : "Use the exact name the portal expects, e.g. enabled or viewMoreText."
            }
          />
          <TextField
            select
            fullWidth
            size="small"
            label="Type"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {FIELD_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!valid}
          onClick={() => {
            onAdd(trimmed, kind);
            onClose();
          }}
        >
          Add field
        </Button>
      </DialogActions>
    </Dialog>
  );
};
