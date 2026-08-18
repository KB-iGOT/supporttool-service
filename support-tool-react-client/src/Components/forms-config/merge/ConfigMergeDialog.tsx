import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { JsonEditor } from "../../common-components/json-editor/json-editor";
import {
  CHANGE_LABELS,
  ChangeKind,
  ConfigChange,
  applyChanges,
  diffConfigs,
  previewValue,
  summarizeChanges,
} from "./diffUtils";

interface ConfigMergeDialogProps {
  open: boolean;
  /** The configuration currently in the editor. */
  current: any;
  onClose: () => void;
  onApply: (merged: any) => void;
}

const KIND_COLOR: Record<ChangeKind, "success" | "warning" | "error"> = {
  added: "success",
  changed: "warning",
  removed: "error",
};

/**
 * Compares the configuration in the editor against one pasted from another
 * environment, and merges the chosen differences back in.
 */
export const ConfigMergeDialog: React.FC<ConfigMergeDialogProps> = ({
  open,
  current,
  onClose,
  onApply,
}) => {
  // The editor hands back a parsed object when the buffer is valid JSON and the raw
  // string while it is not, so both are tracked: the raw text is the only way to tell
  // "nothing pasted yet" from a deliberately empty object.
  const [incoming, setIncoming] = useState<any>(null);
  const [rawText, setRawText] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [resetKey, setResetKey] = useState(0);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (open) {
      setIncoming(null);
      setRawText("");
      setSelected(new Set());
      setResetKey((prev) => prev + 1);
    }
  }, [open]);

  const parsed = useMemo(() => {
    if (!rawText.trim()) return { value: null as any, error: null as string | null };
    if (typeof incoming === "object" && incoming !== null) {
      return { value: incoming, error: null };
    }
    try {
      return { value: JSON.parse(rawText), error: null };
    } catch (err: any) {
      return { value: null, error: err?.message || "That is not valid JSON." };
    }
  }, [incoming, rawText]);

  const changes = useMemo<ConfigChange[]>(
    () => (parsed.value === null ? [] : diffConfigs(current, parsed.value)),
    [current, parsed.value]
  );

  const summary = useMemo(() => summarizeChanges(changes), [changes]);

  // Everything is selected as soon as a valid config is pasted; unticking is the
  // exception, and it saves ticking dozens of rows in the common case.
  useEffect(() => {
    setSelected(new Set(changes.map((c) => c.pathKey)));
  }, [changes]);

  const toggle = (pathKey: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pathKey)) next.delete(pathKey);
      else next.add(pathKey);
      return next;
    });

  const selectKind = (kind: ChangeKind | "all" | "none") => {
    if (kind === "none") return setSelected(new Set());
    if (kind === "all") return setSelected(new Set(changes.map((c) => c.pathKey)));
    setSelected(new Set(changes.filter((c) => c.kind === kind).map((c) => c.pathKey)));
  };

  const merged = useMemo(
    () => applyChanges(current, changes, selected),
    [current, changes, selected]
  );

  const unchanged = parsed.value !== null && changes.length === 0;

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6">Compare &amp; merge</Typography>
          <Typography variant="body2" color="text.secondary">
            Paste the configuration from the other environment, then pick which
            differences to bring across.
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Configuration JSON from the other environment
          </Typography>
          <JsonEditor
            key={resetKey}
            height={320}
            input=""
            onEditorMount={(editor: any) => {
              editorRef.current = editor;
            }}
            onChange={(value: any) => {
              setIncoming(value);
              setRawText(editorRef.current?.getValue?.() ?? "");
            }}
          />
          <Typography
            variant="caption"
            color={parsed.error ? "error" : "text.secondary"}
            sx={{ display: "block", mt: 0.5 }}
          >
            {parsed.error
              ? `Not valid JSON — ${parsed.error}`
              : "Paste the data object — the same shape as the Data tab. Use the editor's fullscreen button for a closer look."}
          </Typography>
        </Box>

        {unchanged && (
          <Alert severity="success">
            The pasted configuration is identical to this one. Nothing to merge.
          </Alert>
        )}

        {changes.length > 0 && (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={`${summary.added} only in pasted`}
              />
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={`${summary.changed} different`}
              />
              <Chip
                size="small"
                color="error"
                variant="outlined"
                label={`${summary.removed} only in current`}
              />
              <Box sx={{ flex: 1 }} />
              <Button size="small" onClick={() => selectKind("all")}>
                Select all
              </Button>
              <Button size="small" onClick={() => selectKind("added")}>
                Only additions
              </Button>
              <Button size="small" onClick={() => selectKind("none")}>
                Select none
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: "45vh" }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Attribute</TableCell>
                    <TableCell>Difference</TableCell>
                    <TableCell>In this config</TableCell>
                    <TableCell>In pasted config</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {changes.map((change) => (
                    <TableRow key={change.pathKey || "(root)"} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selected.has(change.pathKey)}
                          onChange={() => toggle(change.pathKey)}
                          inputProps={{
                            "aria-label": `Merge ${change.pathKey || "whole configuration"}`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                        {change.pathKey || "(whole configuration)"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={KIND_COLOR[change.kind]}
                          label={CHANGE_LABELS[change.kind]}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12, maxWidth: 320 }}>
                        <Tooltip title={previewValue(change.current, 2000)}>
                          <span>{previewValue(change.current)}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12, maxWidth: 320 }}>
                        <Tooltip title={previewValue(change.incoming, 2000)}>
                          <span>{previewValue(change.incoming)}</span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Result preview
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  maxHeight: "20vh",
                  overflow: "auto",
                  bgcolor: "action.hover",
                  borderRadius: 1,
                  fontSize: 12,
                }}
              >
                {JSON.stringify(merged, null, 2)}
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={selected.size === 0}
          onClick={() => {
            onApply(merged);
            onClose();
          }}
        >
          Apply {selected.size} {selected.size === 1 ? "change" : "changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
