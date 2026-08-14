import React, { useEffect, useState } from "react";
import { TextField } from "@mui/material";

interface KeyNameFieldProps {
  /** The key as it currently exists in the document. */
  value: string;
  /** Other keys in the same object, so duplicates can be reported before committing. */
  siblings?: string[];
  onCommit: (next: string) => void;
  ariaLabel: string;
}

/**
 * Edits an object key.
 *
 * Renaming is committed on blur or Enter rather than per keystroke: a rename changes
 * the key, which changes the node's React key and remounts the row — committing while
 * typing would drop focus after every character.
 */
export const KeyNameField: React.FC<KeyNameFieldProps> = ({
  value,
  siblings = [],
  onCommit,
  ariaLabel,
}) => {
  const [draft, setDraft] = useState(value);

  // Re-sync when the committed key changes, which also reverts a rejected rename.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const trimmed = draft.trim();
  const duplicate = trimmed !== value && siblings.includes(trimmed);
  const invalid = trimmed.length === 0 || duplicate;

  const commit = () => {
    if (invalid) {
      setDraft(value);
      return;
    }
    if (trimmed !== value) onCommit(trimmed);
  };

  return (
    <TextField
      size="small"
      variant="standard"
      value={draft}
      error={invalid}
      helperText={duplicate ? "Already used here" : trimmed ? undefined : "Name required"}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        } else if (e.key === "Escape") {
          setDraft(value);
        }
      }}
      inputProps={{ "aria-label": ariaLabel }}
      sx={{ flex: 1, minWidth: 0 }}
    />
  );
};
