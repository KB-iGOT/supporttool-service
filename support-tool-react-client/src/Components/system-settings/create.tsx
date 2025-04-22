import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { systemSettingsService } from "../../services/system-settings.service";
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Paper,
  Tooltip,
  Snackbar,
  Alert,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  FormHelperText,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import { JsonEditor } from "../common-components/json-editor/json-editor";

export const Create = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState<string>("{}");
  const [configKey, setConfigKey] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [valueFormat, setValueFormat] = useState<string>("json");
  const [valueError, setValueError] = useState<string>("");
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });
  const editorRef = useRef<any>(null);

  const handleChange = (data: any) => {
    setInput(data);
    // Clear error when user types
    if (valueError) setValueError("");
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    // Clear error when user types
    if (valueError) setValueError("");
  };

  const handleConfigKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfigKey(e.target.value);
  };

  const handleValueFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFormat = e.target.value;
    setValueFormat(newFormat);
    
    // Reset input when switching to JSON format
    if (newFormat === "json" && (input === "" || !isValidJson(input))) {
      setInput("{}");
    } else if (newFormat === "text") {
      setInput("");
    }
    
    // Clear any validation errors when changing format
    setValueError("");
  };

  const isValidJson = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleCreateConfig = async () => {
    // Reset validation errors
    setValueError("");
    
    // Validate key field
    if (!configKey.trim()) {
      setNotification({
        open: true,
        message: "Configuration key is required",
        severity: "error",
      });
      return;
    }
    
    // Validate key format
    if (configKey.includes(' ')) {
      setNotification({
        open: true,
        message: "Configuration key cannot contain spaces",
        severity: "error",
      });
      return;
    }
    
    if (!configKey.match(/^[a-z]/)) {
      setNotification({
        open: true,
        message: "Configuration key must start with a lowercase letter",
        severity: "error",
      });
      return;
    }

    // Validate value field is not empty
    let currentValue = "";
    
    if (valueFormat === "json") {
      if (!editorRef.current) return;
      currentValue = editorRef.current.getValue();
      
      // Check if JSON is empty or just {}
      if (!currentValue || currentValue.trim() === "{}" || currentValue.trim() === "[]") {
        setValueError("Value is required. Please provide a valid JSON value.");
        setNotification({
          open: true,
          message: "Please provide a value for the configuration",
          severity: "error",
        });
        return;
      }
    } else {
      // For text format
      if (!input.trim()) {
        setValueError("Value is required. Please enter some text.");
        setNotification({
          open: true,
          message: "Please provide a value for the configuration",
          severity: "error",
        });
        return;
      }
      currentValue = input;
    }

    try {
      setIsSubmitting(true);
      
      let valueToSave;

      if (valueFormat === "json") {
        // Validate JSON before submitting
        try {
          valueToSave = JSON.parse(currentValue);
        } catch (e) {
          setValueError("Invalid JSON. Please fix syntax errors.");
          setNotification({
            open: true,
            message: "Invalid JSON. Please fix syntax errors before saving.",
            severity: "error",
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        // For non-JSON values, use the input directly
        valueToSave = currentValue;
      }

      const configPayload = {
        request: {
          id: configKey,
          field: configKey,
          value: valueFormat === "json" ? JSON.stringify(valueToSave) : valueToSave,
        },
      };

      const response = await systemSettingsService.createConfig(configPayload);
      if (response.responseCode === "OK") {
        setNotification({
          open: true,
          message: "Configuration created successfully",
          severity: "success",
        });
        navigate("/system-settings");
      } else {
        setNotification({
          open: true,
          message: response.responseMessage || "Failed to create configuration",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error creating configuration:", error);
      setNotification({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Creation failed due to an unexpected error",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/system-settings");
  };

  const formatJson = () => {
    if (valueFormat !== "json" || !editorRef.current) return;

    try {
      const currentValue = editorRef.current.getValue();

      try {
        // Try to parse and format
        const parsedJson = JSON.parse(currentValue);
        const formattedJson = JSON.stringify(parsedJson, null, 2);

        if (formattedJson !== currentValue) {
          editorRef.current.setValue(formattedJson);
          setInput(formattedJson);

          setNotification({
            open: true,
            message: "JSON formatted successfully",
            severity: "success",
          });
        }
      } catch (error) {
        // If it fails, use the editor's built-in formatter
        editorRef.current.getAction("editor.action.formatDocument")?.run();

        setNotification({
          open: true,
          message: "JSON has syntax errors. Basic formatting applied.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error formatting JSON:", error);
      setNotification({
        open: true,
        message: "Failed to format JSON",
        severity: "error",
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            size="small"
          >
            Back
          </Button>
          <Typography variant="h6">Create System Setting</Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {valueFormat === "json" && (
            <Tooltip title="Format JSON">
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<FormatAlignLeftIcon />}
                onClick={formatJson}
                disabled={isSubmitting || !editorRef.current}
                size="small"
              >
                Format JSON
              </Button>
            </Tooltip>
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleCreateConfig}
            disabled={isSubmitting}
            size="small"
          >
            Create Setting
          </Button>
        </Box>
      </Paper>

      {/* Configuration Key and Format Selection */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Grid container spacing={3}>
        <Grid item xs={12}>
  <TextField
    fullWidth
    required
    label="Setting Key"
    value={configKey}
    onChange={handleConfigKeyChange}
    variant="outlined"
    disabled={isSubmitting}
    error={
      Boolean(configKey) && 
      (!configKey.match(/^[a-z]/) || 
      configKey.includes(' ') ||
      !configKey.match(/^[a-z][a-zA-Z0-9]*$/))
    }
    helperText={
      configKey ? 
        (configKey.includes(' ') ? 
          "Key must not contain spaces. Use dots or hyphens instead (e.g., 'systemTimeout')." : 
          (!configKey.match(/^[a-z]/) ? 
            "Key must start with a lowercase letter." : 
            (!configKey.match(/^[a-z][a-zA-Z0-9]*$/) ?
              "Key can only contain letters, numbers." :
              "Unique identifier for this setting (e.g., 'systemTimeout' or 'appUserProfile')")
          )
        ) : 
        "Unique identifier for this setting (e.g., 'systemTimeout')"
    }
  />
</Grid>
          
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Value Format</FormLabel>
              <RadioGroup
                row
                name="value-format"
                value={valueFormat}
                onChange={handleValueFormatChange}
              >
                <FormControlLabel 
                  value="json" 
                  control={<Radio />} 
                  label="JSON" 
                  disabled={isSubmitting}
                />
                <FormControlLabel 
                  value="text" 
                  control={<Radio />} 
                  label="Plain Text" 
                  disabled={isSubmitting}
                />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Value Editor */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Setting Value <span style={{ color: 'red' }}>*</span>
        </Typography>
        
        <Box
          position="relative"
          sx={{
            height: valueFormat === "json" ? "400px" : "auto",
            minHeight: valueFormat === "json" ? "300px" : "auto",
            border: valueError ? "1px solid #d32f2f" : "none",
            borderRadius: valueError ? "4px" : "0",
          }}
        >
          {isSubmitting && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="rgba(0,0,0,0.3)"
              zIndex={2}
            >
              <CircularProgress />
            </Box>
          )}

          {valueFormat === "json" ? (
            <>
              <JsonEditor
                input={input}
                onChange={handleChange}
                onEditorMount={handleEditorDidMount}
              />
              {valueError && (
                <FormHelperText error>{valueError}</FormHelperText>
              )}
            </>
          ) : (
            <TextField
              fullWidth
              required
              multiline
              rows={8}
              value={input}
              onChange={handleTextFieldChange}
              variant="outlined"
              placeholder="Enter configuration value as plain text"
              disabled={isSubmitting}
              error={Boolean(valueError)}
              helperText={valueError || ""}
            />
          )}
        </Box>
      </Paper>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          elevation={6}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};