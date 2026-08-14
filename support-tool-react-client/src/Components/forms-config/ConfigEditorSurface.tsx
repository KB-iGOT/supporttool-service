import React, { useState } from "react";
import { Box, Card, CardContent, Divider, Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { CheckCircle as CheckCircleIcon, Warning as WarningIcon } from "@mui/icons-material";
import { JsonEditor } from "../common-components/json-editor/json-editor";
import { ConfigFormBuilder } from "./form-builder";

type EditorTab = "fields" | "json";
type EditorSection = "data" | "criteria" | "details";

interface ConfigEditorSurfaceProps {
  dataDraft: any;
  criteriaDraft: any;
  onDataChange: (value: any) => void;
  onCriteriaChange: (value: any) => void;
  /** Rendered for the Details section — create and edit supply different panels. */
  detailsPanel: React.ReactNode;
  /** Shows a dot on the section that has unsaved edits. */
  dirty?: { data?: boolean; criteria?: boolean; details?: boolean };
  /** Bump to remount the JSON editors, e.g. after reloading from the portal. */
  editorKey: number;
}

const SECTION_HELP: Record<EditorSection, string> = {
  data: "The configuration payload sent to the portal (result.data).",
  criteria: "Targeting rules for this configuration (result.criteria), e.g. role and rootOrg.",
  details: "Top-level properties of this configuration.",
};

/**
 * The editing surface shared by create and edit: the tab picks how you edit
 * (form or raw JSON) and the toggle picks what you edit.
 */
export const ConfigEditorSurface: React.FC<ConfigEditorSurfaceProps> = ({
  dataDraft,
  criteriaDraft,
  onDataChange,
  onCriteriaChange,
  detailsPanel,
  dirty = {},
  editorKey,
}) => {
  const [tab, setTab] = useState<EditorTab>("fields");
  const [section, setSection] = useState<EditorSection>("data");

  const isJsonSection = section === "data" || section === "criteria";
  const activeDraft = section === "criteria" ? criteriaDraft : dataDraft;
  const setActiveDraft = section === "criteria" ? onCriteriaChange : onDataChange;
  const activeValid = typeof activeDraft === "object" && activeDraft !== null;

  return (
    <Card>
      <Tabs value={tab} onChange={(_e, value: EditorTab) => setTab(value)}>
        <Tab value="fields" label="Form Fields" />
        <Tab value="json" label="JSON Editor" />
      </Tabs>
      <Divider />

      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
            mb: 2,
          }}
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={section}
            onChange={(_e, value: EditorSection | null) => value && setSection(value)}
          >
            <ToggleButton value="details">Details{dirty.details ? " •" : ""}</ToggleButton>
            <ToggleButton value="criteria">Criteria{dirty.criteria ? " •" : ""}</ToggleButton>
            <ToggleButton value="data">Data{dirty.data ? " •" : ""}</ToggleButton>
          </ToggleButtonGroup>

          {isJsonSection && tab === "json" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: activeValid ? "success.main" : "warning.main",
              }}
            >
              {activeValid ? (
                <CheckCircleIcon color="success" fontSize="small" />
              ) : (
                <WarningIcon color="warning" fontSize="small" />
              )}
              <Typography variant="body2">{activeValid ? "Valid JSON" : "Invalid JSON"}</Typography>
            </Box>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {SECTION_HELP[section]}
        </Typography>

        {section === "details" ? (
          detailsPanel
        ) : tab === "json" ? (
          <JsonEditor key={`${section}-${editorKey}`} input={activeDraft} onChange={setActiveDraft} />
        ) : (
          // Same draft as the JSON tab, so the two views stay in sync.
          <ConfigFormBuilder value={activeDraft} onChange={setActiveDraft} />
        )}
      </CardContent>
    </Card>
  );
};
