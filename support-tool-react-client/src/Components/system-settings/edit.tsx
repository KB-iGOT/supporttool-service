import React, { useMemo, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { systemSettingsService } from "../../services/system-settings.service";
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Paper,
  Tooltip,
  TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import { JsonEditor } from "../common-components/json-editor/json-editor";
import { AppContext } from "../../Context/AppContext";
import { appContextType } from "../../types";

export const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
    const { setNotification } = useContext(
      AppContext,
    ) as appContextType;
  const [input, setInput] = useState<string>("");
  const [configData, setConfigData] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isJsonValue, setIsJsonValue] = useState<boolean>(true);
  const editorRef = useRef<any>(null);

  const getConfigData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await systemSettingsService.getConfig(id);
      if (response.responseCode === "OK") {
        setConfigData(response.result.response);

        // Check if the value is JSON
        try {
          // If it's already a string, try to parse it as JSON
          if (typeof response.result.response.value === "string") {
            JSON.parse(response.result.response.value);
            setIsJsonValue(true);
          } else {
            // If it's an object, it's already JSON
            setIsJsonValue(true);
          }
        } catch (e) {
          // If parsing fails, it's not a JSON value
          setIsJsonValue(false);
        }

        setInput(response.result.response.value);
      } else {
        setError(response.responseMessage || "Failed to load configuration");
      }
    } catch (err) {
      console.error("Error fetching configuration:", err);
      setError("Failed to load configuration data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (data: any) => {
    setInput(data);
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleUpdateConfig = async () => {
    try {
      setIsLoading(true);

      let valueToUpdate;

      if (isJsonValue) {
        if (!editorRef.current) return;

        const currentValue = editorRef.current.getValue();

        // Validate JSON before submitting
        try {
          valueToUpdate = JSON.parse(currentValue);
        } catch (e) {
          setNotification({
            open: true,
            message: "Invalid JSON. Please fix syntax errors before saving.",
            severity: "error",
          });
          return;
        }
      } else {
        // For non-JSON values, use the input directly
        valueToUpdate = input;
      }

      const updatedConfig = {
        request: {
          ...configData,
          value: JSON.stringify(valueToUpdate),
        },
      };

      const response = await systemSettingsService.updateConfig(updatedConfig);
      if (response.responseCode === "OK") {
        setNotification({
          open: true,
          message: "Configuration updated successfully",
          severity: "success",
        });
        navigate("/system-settings");
      } else {
        setNotification({
          open: true,
          message: response.responseMessage || "Failed to update configuration",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error updating configuration:", error);
      setNotification({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Update failed due to an unexpected error",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/system-settings");
  };

  const formatJson = () => {
    if (!isJsonValue || !editorRef.current) return;

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

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  useMemo(() => {
    if (id) {
      getConfigData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading && !input) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="50vh"
      >
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
          <Typography variant="h6">
            {configData?.name || "Configuration Settings"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {isJsonValue && (
            <Tooltip title="Format JSON">
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<FormatAlignLeftIcon />}
                onClick={formatJson}
                disabled={isLoading || !editorRef.current}
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
            onClick={handleUpdateConfig}
            disabled={isLoading}
            size="small"
          >
            Save Changes
          </Button>
        </Box>
      </Paper>

      <Box
        position="relative"
        sx={{
          height: isJsonValue ? "calc(100vh - 180px)" : "auto",
          minHeight: isJsonValue ? "400px" : "auto",
        }}
      >
        {isLoading && (
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

        {isJsonValue ? (
          <JsonEditor
            input={input}
            onChange={handleChange}
            onEditorMount={handleEditorDidMount}
          />
        ) : (
          <TextField
            fullWidth
            label="Configuration Value"
            multiline
            rows={8}
            value={input}
            onChange={handleTextFieldChange}
            variant="outlined"
            margin="normal"
            sx={{
              backgroundColor: "white",
              borderRadius: "4px",
              "& .MuiFilledInput-root": {
                backgroundColor: "white",
                "&:hover": {
                  backgroundColor: "white",
                  opacity: 0.9,
                },
                "&.Mui-focused": {
                  backgroundColor: "white",
                },
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
};
