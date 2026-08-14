import React from "react";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";

export interface ConfigIdentity {
  name: string;
  type: string;
  subType: string;
  portal: string;
  clientVersion: number | string;
}

interface ConfigDetailsPanelProps {
  value: ConfigIdentity;
  onChange: (patch: Partial<ConfigIdentity>) => void;
  /**
   * Create allows the identifying fields to be set; edit does not — they are what
   * the portal looks the record up by.
   */
  identityEditable?: boolean;
  /** Values already in use, offered as suggestions when creating. */
  suggestions?: { type: string[]; subType: string[]; portal: string[] };
  errors?: Partial<Record<keyof ConfigIdentity, string>>;
}

const SuggestField: React.FC<{
  label: string;
  value: string;
  options: string[];
  error?: string;
  onChange: (value: string) => void;
}> = ({ label, value, options, error, onChange }) => (
  <Autocomplete
    freeSolo
    size="small"
    options={options}
    value={value}
    onInputChange={(_event, next) => onChange(next)}
    renderInput={(params) => (
      <TextField
        {...params}
        required
        label={label}
        error={Boolean(error)}
        helperText={error || " "}
      />
    )}
  />
);

/**
 * The configuration's top-level properties, shared by the create and edit screens.
 */
export const ConfigDetailsPanel: React.FC<ConfigDetailsPanelProps> = ({
  value,
  onChange,
  identityEditable = false,
  suggestions,
  errors = {},
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <TextField
      fullWidth
      required
      size="small"
      label="Name"
      value={value.name}
      onChange={(e) => onChange({ name: e.target.value })}
      error={Boolean(errors.name)}
      helperText={errors.name || "The identifier this configuration is looked up by."}
    />

    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
      {identityEditable ? (
        <>
          <SuggestField
            label="Type"
            value={value.type}
            options={suggestions?.type || []}
            error={errors.type}
            onChange={(next) => onChange({ type: next })}
          />
          <SuggestField
            label="Sub Type"
            value={value.subType}
            options={suggestions?.subType || []}
            error={errors.subType}
            onChange={(next) => onChange({ subType: next })}
          />
          <SuggestField
            label="Portal"
            value={value.portal}
            options={suggestions?.portal || []}
            error={errors.portal}
            onChange={(next) => onChange({ portal: next })}
          />
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Client Version"
            value={value.clientVersion}
            onChange={(e) =>
              onChange({ clientVersion: e.target.value === "" ? "" : Number(e.target.value) })
            }
            helperText=" "
          />
        </>
      ) : (
        <>
          <TextField fullWidth disabled size="small" label="Type" value={value.type || ""} />
          <TextField fullWidth disabled size="small" label="Sub Type" value={value.subType || ""} />
          <TextField fullWidth disabled size="small" label="Portal" value={value.portal || ""} />
          <TextField
            fullWidth
            disabled
            size="small"
            label="Client Version"
            value={value.clientVersion === "" ? "" : String(value.clientVersion)}
          />
        </>
      )}
    </Box>

    <Typography variant="caption" color="text.secondary">
      {identityEditable
        ? "Type, sub type and portal decide how the portal finds this configuration. They cannot be changed after it is created."
        : "Type, sub type, portal and client version identify the configuration and are read-only here."}
    </Typography>
  </Box>
);
