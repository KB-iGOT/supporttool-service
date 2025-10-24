import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
  Alert,
  Snackbar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";
import { useActionInterceptor } from "../../hooks/useActionInterceptor";
import { contentsService } from "../../services/contents.service";
import { JsonEditor } from "../common-components/json-editor/json-editor";

export const ContentHierarchy = () => {
  const [identifier, setIdentifier] = useState("");
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" } | null>(null);

  const handleSearch = async () => {
    if (!identifier.trim()) {
      setError("Please enter a content identifier.");
      return;
    }
    setHierarchyData(null);
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await contentsService.getContentHierarchy(identifier);
      console.log('Raw hierarchy data received:', data); // Debug log
      
      // The hierarchy from Cassandra is inside the 'hierarchy' column of the first row
      let parsedData;
      if (data[0]?.hierarchy) {
        try {
          parsedData = JSON.parse(data[0].hierarchy);
          console.log('Parsed hierarchy data:', parsedData); // Debug log
        } catch (parseError) {
          console.error('Error parsing hierarchy JSON:', parseError);
          parsedData = data[0].hierarchy; // Use raw data if parsing fails
        }
      } else if (data.length > 0) {
        parsedData = data;
      } else {
        parsedData = null;
      }
      
      setHierarchyData(parsedData);
      console.log('Setting hierarchyData to:', parsedData); // Debug log
    } catch (err: any) {
      console.error('Error fetching hierarchy:', err);
      setError(err.response?.data?.message || "Failed to fetch content hierarchy.");
      setHierarchyData(null);
    } finally {
      setLoading(false);
    }
  };

  // Create a ref to hold the latest data for the action interceptor
  const latestHierarchyDataRef = useRef<{ hierarchy: any }>({ hierarchy: null });

  // This function will be called by the interceptor upon completion (JIRA link provided)
  const saveWithJira = useCallback(async (interceptPayload: any, hierarchyInfo: { hierarchy: any }) => {
    setSaving(true);
    try {
      await contentsService.updateContentHierarchy(identifier, {
        hierarchy: hierarchyInfo.hierarchy,
        jiraLink: interceptPayload?.jiraLink || "",
      });
      setToast({ open: true, message: "Hierarchy updated successfully!", severity: "success" });
    } catch (err: any) {
      setToast({ open: true, message: err.response?.data?.message || "Failed to update hierarchy.", severity: "error" });
    } finally {
      setSaving(false);
    }
  }, [identifier, setSaving, setToast]);

  // Action interceptor for saving the hierarchy
  const { handleAction: handleSaveWithJira } = useActionInterceptor({
    actionType: 'Save',
    onComplete: (interceptPayload) => saveWithJira(interceptPayload, latestHierarchyDataRef.current),
    getPayload: () => ({})
  });

  // This is the function that gets called when the save button is clicked
  const handleSave = useCallback(() => {
    // Update the ref with the latest hierarchy data
    latestHierarchyDataRef.current = {
      hierarchy: hierarchyData
    };
    // Trigger the action interceptor, which will show the JIRA popup
    handleSaveWithJira();
  }, [hierarchyData, handleSaveWithJira]);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleToastClose = () => {
    setToast(null);
  };

  // Enhanced change handler for the JsonEditor
  const handleHierarchyChange = useCallback((newData: any) => {
    console.log('Hierarchy data changed to:', newData); // Debug log
    setHierarchyData(newData);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Content Hierarchy
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <TextField
            fullWidth
            label="Content Identifier"
            variant="outlined"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{ flexGrow: 1, mr: 2 }}
            error={searched && !!error}
            helperText={searched ? error : ""}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            sx={{ whiteSpace: "nowrap" }}
          >
            Search
          </Button>
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {searched && !loading && !hierarchyData && !error && (
        <Alert severity="info">No hierarchy data found for the given identifier.</Alert>
      )}

      {hierarchyData && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Hierarchy Data
          </Typography>
          <Box sx={{ height: '500px', minHeight: '400px' }}>
            <JsonEditor 
              input={hierarchyData} 
              onChange={handleHierarchyChange}
            />
          </Box>
        </Paper>
      )}

      {hierarchyData && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving || loading}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Save
          </Button>
        </Box>
      )}

      {toast && (
        <Snackbar open={toast.open} autoHideDuration={6000} onClose={handleToastClose}>
          <Alert onClose={handleToastClose} severity={toast.severity} sx={{ width: "100%" }}>
            {toast.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};