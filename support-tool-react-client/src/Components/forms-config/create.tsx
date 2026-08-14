import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from "@mui/icons-material";
import { formsConfigService } from "../../services/forms-config.service";
import { useActionIntercept } from "../../Context/AppContext";
import { ConfigDetailsPanel, ConfigIdentity } from "./ConfigDetailsPanel";
import { ConfigEditorSurface } from "./ConfigEditorSurface";
import { FormConfigRow } from "./types";
import { normalizeFormsConfigList } from "./utils";

const BLANK_IDENTITY: ConfigIdentity = {
  name: "",
  type: "page",
  subType: "",
  portal: "portal",
  clientVersion: 1,
};

/** Every config in the samples targets a role and a root org. */
const DEFAULT_CRITERIA = { role: "PUBLIC", rootOrg: "*" };

const unique = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));

export const FormsConfigCreate = () => {
  const navigate = useNavigate();
  const { interceptAction } = useActionIntercept();

  const [identity, setIdentity] = useState<ConfigIdentity>(BLANK_IDENTITY);
  const [dataDraft, setDataDraft] = useState<any>({});
  const [criteriaDraft, setCriteriaDraft] = useState<any>(DEFAULT_CRITERIA);
  const editorKey = 0;

  const [existing, setExisting] = useState<FormConfigRow[]>([]);

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string>("");

  // The existing configs supply the type/subType/portal suggestions and the
  // duplicate-name check.
  useEffect(() => {
    formsConfigService
      .getFormsConfigList()
      .then((response) => setExisting(normalizeFormsConfigList(response)))
      .catch((err) => console.error("Could not load existing configs for suggestions:", err));
  }, []);

  const suggestions = useMemo(
    () => ({
      type: unique(existing.map((row) => row.type)),
      subType: unique(existing.map((row) => row.subType)),
      portal: unique(existing.map((row) => row.portal)),
    }),
    [existing]
  );

  const trimmedName = identity.name.trim();
  const nameTaken = existing.some((row) => row.name.toLowerCase() === trimmedName.toLowerCase());

  const errors = {
    name: !trimmedName
      ? "Name is required."
      : nameTaken
      ? "A configuration with this name already exists."
      : undefined,
    type: identity.type.trim() ? undefined : "Type is required.",
    subType: identity.subType.trim() ? undefined : "Sub type is required.",
    portal: identity.portal.trim() ? undefined : "Portal is required.",
  };

  const isObject = (value: any) => typeof value === "object" && value !== null;
  const dataValid = isObject(dataDraft);
  const criteriaValid = isObject(criteriaDraft);
  const canCreate =
    !Object.values(errors).some(Boolean) && dataValid && criteriaValid && !saving;

  const handleCreate = () => {
    if (!canCreate) return;

    const requestPayload = {
      name: trimmedName,
      type: identity.type.trim(),
      subType: identity.subType.trim(),
      portal: identity.portal.trim(),
      criteria: criteriaDraft,
      data: dataDraft,
      clientVersion: identity.clientVersion,
    };

    interceptAction("FORMS_CONFIG", { requestPayload, count: 1 }, async (auditData: any) => {
      setSaving(true);
      setError(null);
      try {
        await formsConfigService.createFormsConfig({
          requestPayload: auditData.requestPayload,
          jiraLink: auditData.jiraLink || "",
          module: "FORMS_CONFIG",
        });
        setSnackbar("Configuration created.");
        navigate("/forms-config");
      } catch (err: any) {
        console.error("Error creating forms config:", err);
        const message =
          err?.response?.data?.error?.params?.errmsg ||
          err?.response?.data?.responseMessage ||
          err?.response?.data?.message ||
          err?.message ||
          "Unknown error occurred";
        setError(`Failed to create configuration. ${message}`);
      } finally {
        setSaving(false);
      }
    });
  };

  const saveHint = errors.name
    ? errors.name
    : errors.type || errors.subType || errors.portal
    ? "Fill in the details before creating."
    : !dataValid || !criteriaValid
    ? "Fix the invalid JSON before creating."
    : "Create this configuration";

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4">New Form Configuration</Typography>
          <Typography variant="body2" color="text.secondary">
            {trimmedName || "Unnamed"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
          <Tooltip title={saveHint}>
            <span>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={handleCreate}
                disabled={!canCreate}
              >
                {saving ? "Creating..." : "Create"}
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/forms-config")}
          >
            Back to list
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Fill in the details, then build the configuration in the form or JSON tab. Creating asks for
        a ticket link and records the full request in the audit log.
      </Alert>

      <ConfigEditorSurface
        dataDraft={dataDraft}
        criteriaDraft={criteriaDraft}
        onDataChange={setDataDraft}
        onCriteriaChange={setCriteriaDraft}
        editorKey={editorKey}
        detailsPanel={
          <ConfigDetailsPanel
            value={identity}
            onChange={(patch) => setIdentity((prev) => ({ ...prev, ...patch }))}
            identityEditable
            suggestions={suggestions}
            errors={errors}
          />
        }
      />

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar("")}
        message={snackbar}
      />
    </Box>
  );
};
