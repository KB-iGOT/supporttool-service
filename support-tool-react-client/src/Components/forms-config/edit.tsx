import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CompareArrows as CompareIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { formsConfigService } from "../../services/forms-config.service";
import { ConfigDetailsPanel } from "./ConfigDetailsPanel";
import { ConfigEditorSurface } from "./ConfigEditorSurface";
import { ConfigMergeDialog } from "./merge";
import { useActionIntercept } from "../../Context/AppContext";
import { FormConfigDetail } from "./types";
import { normalizeFormConfigDetail } from "./utils";

/** Which navigation is waiting on the "discard changes?" prompt. */
type PendingAction = "refresh" | "back" | null;

const serialize = (value: any): string =>
  typeof value === "string" ? value : JSON.stringify(value ?? null);

export const FormsConfigEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { interceptAction } = useActionIntercept();

  const [detail, setDetail] = useState<FormConfigDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string>("");

  // Working copies, plus the pristine snapshots they are compared against.
  const [dataDraft, setDataDraft] = useState<any>(null);
  const [criteriaDraft, setCriteriaDraft] = useState<any>(null);
  const [nameDraft, setNameDraft] = useState<string>("");
  const [baseline, setBaseline] = useState<{ data: string; criteria: string; name: string }>({
    data: "",
    criteria: "",
    name: "",
  });

  // Remounts the Monaco editors whenever a fresh read replaces the drafts.
  const [editorKey, setEditorKey] = useState<number>(0);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [mergeOpen, setMergeOpen] = useState<boolean>(false);

  const fetchDetail = useCallback(async (configId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await formsConfigService.getFormsConfigById(configId);
      const normalized = normalizeFormConfigDetail(response);

      if (!normalized) {
        setError("The configuration response was empty or in an unexpected format.");
        setDetail(null);
        return;
      }

      const data = normalized.data ?? {};
      const criteria = normalized.criteria ?? {};

      setDetail(normalized);
      setDataDraft(data);
      setCriteriaDraft(criteria);
      setNameDraft(normalized.name);
      setBaseline({
        data: serialize(data),
        criteria: serialize(criteria),
        name: normalized.name,
      });
      setEditorKey((prev) => prev + 1);
    } catch (err: any) {
      console.error("Error reading forms config:", err);
      const message =
        err?.response?.data?.responseMessage ||
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error occurred";
      setError(`Failed to load configuration. ${message}`);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) fetchDetail(id);
  }, [id, fetchDetail]);

  // The editor returns a parsed object while the buffer is valid JSON,
  // and the raw string while it is mid-edit and unparseable.
  const isParsed = (value: any) => typeof value === "object" && value !== null;

  const dataValid = isParsed(dataDraft);
  const criteriaValid = isParsed(criteriaDraft);
  const nameValid = nameDraft.trim().length > 0;

  const dataDirty = useMemo(
    () => serialize(dataDraft) !== baseline.data,
    [dataDraft, baseline.data]
  );
  const criteriaDirty = useMemo(
    () => serialize(criteriaDraft) !== baseline.criteria,
    [criteriaDraft, baseline.criteria]
  );
  const nameDirty = nameDraft !== baseline.name;
  const isDirty = dataDirty || criteriaDirty || nameDirty;

  const runAction = (action: Exclude<PendingAction, null>) => {
    if (action === "refresh") {
      if (id) fetchDetail(id);
    } else {
      navigate("/forms-config");
    }
  };

  // Guard destructive navigation while there are unsaved edits.
  const requestAction = (action: Exclude<PendingAction, null>) => {
    if (isDirty) {
      setPendingAction(action);
      return;
    }
    runAction(action);
  };

  const handleSave = () => {
    if (!detail || !id || !dataValid || !criteriaValid || !nameValid) return;

    // Everything the update API expects: identity, the details, criteria and data.
    const requestPayload = {
      id: /^\d+$/.test(id) ? Number(id) : id,
      name: nameDraft.trim(),
      type: detail.type,
      subType: detail.subType,
      portal: detail.portal,
      criteria: criteriaDraft,
      data: dataDraft,
      clientVersion: detail.clientVersion,
    };

    // A ticket link is collected before the change is sent, for the audit trail.
    interceptAction("FORMS_CONFIG", { requestPayload, count: 1 }, async (auditData: any) => {
      setSaving(true);
      setSaveError(null);
      try {
        await formsConfigService.updateFormsConfig({
          requestPayload: auditData.requestPayload,
          jiraLink: auditData.jiraLink || "",
          module: "FORMS_CONFIG",
        });
        setSnackbar("Configuration updated successfully.");
        // Re-read so the drafts and the dirty baseline reflect what is now stored.
        await fetchDetail(id);
      } catch (err: any) {
        console.error("Error updating forms config:", err);
        const message =
          err?.response?.data?.error?.params?.errmsg ||
          err?.response?.data?.responseMessage ||
          err?.response?.data?.message ||
          err?.message ||
          "Unknown error occurred";
        setSaveError(`Failed to update configuration. ${message}`);
      } finally {
        setSaving(false);
      }
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ wordBreak: "break-word" }}>
            {detail?.name || "Edit Form Configuration"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {id ?? "-"}
            {isDirty && " • Unsaved changes"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
          {/* <Tooltip title="Compare this configuration with one from another environment">
            <span>
              <Button
                variant="outlined"
                startIcon={<CompareIcon />}
                onClick={() => setMergeOpen(true)}
                disabled={loading || !dataValid}
              >
                Compare
              </Button>
            </span>
          </Tooltip> */}
          <Tooltip title="Reload the latest configuration from the portal">
            <span>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => requestAction("refresh")}
                disabled={loading || !id}
              >
                Refresh
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            title={
              !isDirty
                ? "No changes to save"
                : !nameValid
                ? "Name cannot be empty"
                : !dataValid || !criteriaValid
                ? "Fix the invalid JSON before saving"
                : "Save changes"
            }
          >
            <span>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving || !isDirty || !dataValid || !criteriaValid || !nameValid}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => requestAction("back")}
          >
            Back to list
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      {detail && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            Name, the criteria map and the configuration data are editable. Saving asks for a ticket
            link and records the exact changes in the audit log.
          </Alert>

          <ConfigEditorSurface
            dataDraft={dataDraft}
            criteriaDraft={criteriaDraft}
            onDataChange={setDataDraft}
            onCriteriaChange={setCriteriaDraft}
            editorKey={editorKey}
            dirty={{ data: dataDirty, criteria: criteriaDirty, details: nameDirty }}
            detailsPanel={
              <ConfigDetailsPanel
                value={{
                  name: nameDraft,
                  type: detail.type,
                  subType: detail.subType,
                  portal: detail.portal,
                  clientVersion: detail.clientVersion,
                }}
                onChange={(patch) => {
                  if (patch.name !== undefined) setNameDraft(patch.name);
                }}
                errors={nameValid ? {} : { name: "Name cannot be empty." }}
              />
            }
          />
        </>
      )}

      <ConfigMergeDialog
        open={mergeOpen}
        current={dataDraft}
        onClose={() => setMergeOpen(false)}
        onApply={(mergedData) => {
          setDataDraft(mergedData);
          // Remount the JSON editor so it shows the merged result.
          setEditorKey((prev) => prev + 1);
          setSnackbar("Merged changes applied. Review them, then save.");
        }}
      />

      <Dialog open={Boolean(pendingAction)} onClose={() => setPendingAction(null)}>
        <DialogTitle>Discard unsaved changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingAction === "refresh"
              ? "Reloading will replace your edits with the latest configuration from the portal."
              : "Leaving this page will discard your edits."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingAction(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              const action = pendingAction;
              setPendingAction(null);
              if (action) runAction(action);
            }}
          >
            Discard
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar("")}
        message={snackbar}
      />
    </Box>
  );
};
