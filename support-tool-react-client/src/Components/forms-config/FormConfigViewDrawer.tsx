import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import Editor from "@monaco-editor/react";
import { formsConfigService } from "../../services/forms-config.service";
import { FormConfigDetail } from "./types";
import { normalizeFormConfigDetail } from "./utils";

interface FormConfigViewDrawerProps {
  open: boolean;
  /** Config id to read; null closes / clears the drawer. */
  id: number | string | null;
  /** Name from the list row, shown until the read call resolves. */
  fallbackName?: string;
  onClose: () => void;
  onEdit?: (id: number | string) => void;
}

const MetaRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: "flex", gap: 2, py: 0.75 }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
      {value}
    </Typography>
  </Box>
);

export const FormConfigViewDrawer: React.FC<FormConfigViewDrawerProps> = ({
  open,
  id,
  fallbackName,
  onClose,
  onEdit,
}) => {
  const [detail, setDetail] = useState<FormConfigDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string>("");

  const fetchDetail = useCallback(async (configId: number | string) => {
    setLoading(true);
    setError(null);
    setDetail(null);

    try {
      const response = await formsConfigService.getFormsConfigById(configId);
      const normalized = normalizeFormConfigDetail(response);

      if (!normalized) {
        setError("The configuration response was empty or in an unexpected format.");
        return;
      }
      setDetail(normalized);
    } catch (err: any) {
      console.error("Error reading forms config:", err);
      const message =
        err?.response?.data?.responseMessage ||
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error occurred";
      setError(`Failed to load configuration. ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && id !== null && id !== undefined) {
      fetchDetail(id);
    }
  }, [open, id, fetchDetail]);

  const handleCopy = () => {
    if (!detail) return;
    navigator.clipboard.writeText(JSON.stringify(detail.data, null, 2));
    setSnackbar("Configuration JSON copied to clipboard");
  };

  const title = detail?.name || fallbackName || "Form Configuration";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: "80%", md: "55%" }, maxWidth: 900 } }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            p: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ wordBreak: "break-word" }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {id ?? "-"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            {onEdit && id !== null && id !== undefined && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => onEdit(id)}
              >
                Edit
              </Button>
            )}
            <Tooltip title="Copy configuration JSON">
              <span>
                <IconButton size="small" onClick={handleCopy} disabled={!detail}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : detail ? (
          <>
            <Box sx={{ p: 2 }}>
              <MetaRow label="Type" value={detail.type || "-"} />
              <MetaRow label="Sub Type" value={detail.subType || "-"} />
              <MetaRow
                label="Portal"
                value={
                  detail.portal ? (
                    <Chip
                      label={detail.portal}
                      size="small"
                      variant="outlined"
                      color={detail.portal === "mobile" ? "secondary" : "primary"}
                    />
                  ) : (
                    "-"
                  )
                }
              />
              <MetaRow label="Client Version" value={detail.clientVersion || "-"} />
              <MetaRow
                label="Criteria"
                value={
                  detail.criteria && Object.keys(detail.criteria).length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {Object.entries(detail.criteria).map(([key, value]) => (
                        <Chip
                          key={key}
                          size="small"
                          variant="outlined"
                          label={`${key}: ${
                            typeof value === "object" ? JSON.stringify(value) : String(value)
                          }`}
                        />
                      ))}
                    </Box>
                  ) : (
                    "-"
                  )
                }
              />
            </Box>

            <Divider />

            <Box sx={{ px: 2, pt: 2 }}>
              <Typography variant="subtitle2">Configuration Data</Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 300, p: 2 }}>
              <Box sx={{ height: "100%", border: "1px solid #ccc" }}>
                <Editor
                  height="100%"
                  language="json"
                  value={JSON.stringify(detail.data, null, 2)}
                  options={{
                    readOnly: true,
                    domReadOnly: true,
                    minimap: { enabled: false },
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                  }}
                  loading={<CircularProgress />}
                />
              </Box>
            </Box>
          </>
        ) : null}
      </Box>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={3000}
        onClose={() => setSnackbar("")}
        message={snackbar}
      />
    </Drawer>
  );
};
