import React, { useState } from "react";
import {
  Autocomplete,
  Box,
  IconButton,
  InputAdornment,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DeleteOutline as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { humanizeKey, isImageKey, isLockedKey, isUrlKey, looksLikeImageUrl } from "./nodeUtils";

interface PrimitiveFieldProps {
  /** Raw key name — drives the widget conventions. */
  fieldKey: string;
  label: string;
  value: string | number | boolean;
  /** Values this key takes elsewhere in the document, offered as suggestions. */
  options?: string[];
  onChange: (value: any) => void;
  /** Only supplied in structure mode — otherwise no delete control is shown. */
  onRemove?: () => void;
}

const LONG_TEXT = 80;

const RemoveButton: React.FC<{ onRemove: () => void }> = ({ onRemove }) => (
  <Tooltip title="Remove this field">
    <IconButton size="small" aria-label="Remove this field" onClick={onRemove} sx={{ mt: 0.5 }}>
      <DeleteIcon fontSize="small" />
    </IconButton>
  </Tooltip>
);

export const PrimitiveField: React.FC<PrimitiveFieldProps> = ({
  fieldKey,
  label,
  value,
  options,
  onChange,
  onRemove,
}) => {
  const lockable = isLockedKey(fieldKey);
  const [unlocked, setUnlocked] = useState(false);
  const locked = lockable && !unlocked;

  // When the row already names the field, `label` is empty — the control still
  // needs an accessible name, so fall back to the key.
  const accessibleName = label || humanizeKey(fieldKey);

  if (typeof value === "boolean") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 40 }}>
        {label && (
          <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
            {label}
          </Typography>
        )}
        <Switch
          size="small"
          checked={value}
          inputProps={{ "aria-label": accessibleName }}
          onChange={(e) => onChange(e.target.checked)}
        />
        <Typography variant="caption" color={value ? "primary.main" : "text.disabled"}>
          {value ? "On" : "Off"}
        </Typography>
        {onRemove && <RemoveButton onRemove={onRemove} />}
      </Box>
    );
  }

  if (typeof value === "number") {
    return (
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label={label || undefined}
          value={value}
          inputProps={{ "aria-label": accessibleName }}
          onChange={(e) => {
            const next = e.target.value;
            onChange(next === "" ? "" : Number(next));
          }}
        />
        {onRemove && <RemoveButton onRemove={onRemove} />}
      </Box>
    );
  }

  const text = String(value ?? "");
  const showImage = isImageKey(fieldKey) && looksLikeImageUrl(text);
  const openable = isUrlKey(fieldKey) && /^https?:\/\//i.test(text);

  // The lock and link controls live in the field itself; their meaning is in the
  // tooltip rather than repeated helper text under every locked field.
  const endAdornment = (lockable || openable) && (
    <InputAdornment position="end">
      {openable && (
        <Tooltip title="Open link">
          <IconButton
            size="small"
            aria-label="Open link"
            onClick={() => window.open(text, "_blank", "noopener")}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {lockable && (
        <Tooltip
          title={
            locked
              ? "The portal looks this value up by name. Click to edit anyway."
              : "Unlocked — changing this may break the portal."
          }
        >
          <IconButton
            size="small"
            aria-label={locked ? "Unlock field" : "Lock field"}
            onClick={() => setUnlocked((prev) => !prev)}
          >
            {locked ? (
              <LockIcon fontSize="small" color="disabled" />
            ) : (
              <LockOpenIcon fontSize="small" color="warning" />
            )}
          </IconButton>
        </Tooltip>
      )}
    </InputAdornment>
  );

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {options && options.length > 0 ? (
          <Autocomplete
            freeSolo
            size="small"
            options={options}
            value={text}
            readOnly={locked}
            onInputChange={(_event, next) => onChange(next)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label || undefined}
                inputProps={{ ...params.inputProps, "aria-label": accessibleName }}
                InputProps={{ ...params.InputProps, endAdornment: endAdornment || params.InputProps.endAdornment }}
              />
            )}
          />
        ) : (
          <TextField
            fullWidth
            size="small"
            label={label || undefined}
            value={text}
            multiline={text.length > LONG_TEXT}
            minRows={text.length > LONG_TEXT ? 3 : undefined}
            inputProps={{ "aria-label": accessibleName }}
            onChange={(e) => onChange(e.target.value)}
            InputProps={{ readOnly: locked, endAdornment }}
          />
        )}
        {showImage && (
          <Box
            component="img"
            src={text}
            alt={label}
            onError={(e: any) => {
              e.currentTarget.style.display = "none";
            }}
            sx={{ mt: 1, maxHeight: 56, maxWidth: "100%", borderRadius: 1, border: "1px solid", borderColor: "divider" }}
          />
        )}
      </Box>
      {onRemove && <RemoveButton onRemove={onRemove} />}
    </Box>
  );
};
