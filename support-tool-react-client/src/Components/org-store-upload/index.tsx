import React, { useState, useRef, useCallback } from "react";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import ImageIcon from "@mui/icons-material/Image";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { orgStoreUploadService } from "../../services/org-store-upload.service";
import { organisationService } from "../../services/organisations.service";
import { usersService } from "../../services/users.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgOption {
  identifier: string;
  orgName: string;
  channel?: string;
}

interface MdoUser {
  userId: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
}

interface UploadResult {
  [key: string]: any;
}

// ─── Tab panel ────────────────────────────────────────────────────────────────

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

// ─── File picker ──────────────────────────────────────────────────────────────

interface FilePickerProps {
  file: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

const FilePicker: React.FC<FilePickerProps> = ({
  file,
  previewUrl,
  onFileSelect,
  onClear,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileSelect(dropped);
  };

  const isImage =
    file && (file.type.startsWith("image/") || file.type === "image/svg+xml");

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          textAlign: "center",
          cursor: "pointer",
          border: dragging ? "2px dashed #1976d2" : "2px dashed #ccc",
          backgroundColor: dragging ? "#e3f2fd" : "#fafafa",
          borderRadius: 2,
          transition: "all 0.2s",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <CloudUploadIcon
          sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
        />
        <Typography variant="body1" color="text.secondary">
          {file ? file.name : "Drag & drop a file here, or click to select"}
        </Typography>
        {file && (
          <Typography variant="caption" color="text.secondary">
            {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown type"}
          </Typography>
        )}
        <input
          ref={inputRef}
          type="file"
          hidden
          accept="image/*,application/pdf,video/mp4"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) onFileSelect(selected);
          }}
        />
      </Paper>

      {previewUrl && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography variant="subtitle2">Preview</Typography>
            <Tooltip title="Remove file">
              <IconButton size="small" onClick={onClear}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {isImage ? (
            <Box
              component="img"
              src={previewUrl}
              alt="preview"
              sx={{
                maxWidth: "100%",
                maxHeight: 300,
                borderRadius: 1,
                border: "1px solid #e0e0e0",
                display: "block",
              }}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 2,
                border: "1px solid #e0e0e0",
                borderRadius: 1,
              }}
            >
              <ImageIcon color="action" />
              <Typography variant="body2">{file?.name}</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

// ─── Upload result display ────────────────────────────────────────────────────

const UploadResultDisplay: React.FC<{
  result: UploadResult;
  label?: string;
}> = ({ result, label }) => {
  const url = result?.result?.url || result?.url || "";
  return (
    <Box sx={{ mt: 3 }}>
      <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ mb: 1 }}>
        {label || "Upload successful!"}
      </Alert>
      {url && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
            <strong>URL: </strong>
            <a href={url} target="_blank" rel="noreferrer">
              {url}
            </a>
          </Typography>
          <Tooltip title="Copy URL">
            <IconButton
              size="small"
              onClick={() => navigator.clipboard.writeText(url)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <Box
        component="pre"
        sx={{
          p: 1.5,
          background: "#f5f5f5",
          borderRadius: 1,
          fontSize: "0.75rem",
          overflowX: "auto",
        }}
      >
        {JSON.stringify(result, null, 2)}
      </Box>
    </Box>
  );
};

// ─── Step badge ───────────────────────────────────────────────────────────────

const StepBadge: React.FC<{ step: number; active: boolean }> = ({
  step,
  active,
}) => (
  <Box
    component="span"
    sx={{
      width: 24,
      height: 24,
      borderRadius: "50%",
      bgcolor: active ? "primary.main" : "grey.400",
      color: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 700,
    }}
  >
    {step}
  </Box>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const OrgStoreUpload: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  // ── KB Org state ──
  const [kbFile, setKbFile] = useState<File | null>(null);
  const [kbPreview, setKbPreview] = useState<string | null>(null);
  const [kbUploading, setKbUploading] = useState(false);
  const [kbResult, setKbResult] = useState<UploadResult | null>(null);

  // ── Other Org state ──
  const [orgSearch, setOrgSearch] = useState("");
  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgOption | null>(null);

  const [mdoUsers, setMdoUsers] = useState<MdoUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MdoUser | null>(null);
  const [selectedUserToken, setSelectedUserToken] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);

  const [otherFile, setOtherFile] = useState<File | null>(null);
  const [otherPreview, setOtherPreview] = useState<string | null>(null);
  const [otherUploading, setOtherUploading] = useState(false);
  const [otherResult, setOtherResult] = useState<UploadResult | null>(null);

  // ── Snackbar ──
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "info" });

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" = "info"
  ) => setSnackbar({ open: true, message, severity });

  // ─── File helpers ─────────────────────────────────────────────────────────

  const buildPreview = (file: File): string => URL.createObjectURL(file);

  const handleKbFileSelect = (file: File) => {
    setKbFile(file);
    setKbPreview(buildPreview(file));
    setKbResult(null);
  };

  const handleOtherFileSelect = (file: File) => {
    setOtherFile(file);
    setOtherPreview(buildPreview(file));
    setOtherResult(null);
  };

  // ─── KB Org Upload ────────────────────────────────────────────────────────

  const handleKbUpload = async () => {
    if (!kbFile) {
      showSnackbar("Please select a file first", "error");
      return;
    }
    setKbUploading(true);
    setKbResult(null);
    try {
      // No selectedUserToken → server uses session token
      const result = await orgStoreUploadService.upload(kbFile);
      setKbResult(result);
      showSnackbar("File uploaded successfully!", "success");
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message || err?.message || "Upload failed",
        "error"
      );
    } finally {
      setKbUploading(false);
    }
  };

  // ─── Org search (reuses existing organisationService) ─────────────────────

  const searchOrganisations = useCallback(async (query: string) => {
    if (!query || query.length < 2) return;
    setOrgLoading(true);
    try {
      const res = await organisationService.fetchOrganisationsData({
        request: {
          filters: { isRootOrg: false },
          query,
          limit: 20,
          offset: 0,
        },
      });
      const list: OrgOption[] = (
        res?.result?.response?.content || []
      ).map((o: any) => ({
        identifier: o.identifier || o.id,
        orgName: o.orgName || o.name || o.identifier,
        channel: o.channel,
      }));
      setOrgOptions(list);
    } catch {
      showSnackbar("Failed to search organisations", "error");
    } finally {
      setOrgLoading(false);
    }
  }, []);

  // ─── Fetch MDO users (reuses existing usersService) ───────────────────────

  const fetchMdoUsers = async (orgId: string) => {
    setUsersLoading(true);
    setMdoUsers([]);
    setSelectedUser(null);
    setSelectedUserToken("");
    try {
      const res = await usersService.getUsers({
        request: {
          filters: {
            "organisations.organisationId": orgId,
            "organisations.roles": ["MDO_LEADER", "MDO_ADMIN"],
          },
          fields: [
            "userId",
            "userName",
            "firstName",
            "lastName",
            "email",
            "organisations",
          ],
          limit: 100,
          offset: 0,
        },
      });
      const users: MdoUser[] = (
        res?.result?.response?.content || []
      ).map((u: any) => ({
        userId: u.userId || u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        userName: u.userName,
        email: u.email,
      }));
      setMdoUsers(users);
      if (users.length === 0) {
        showSnackbar(
          "No MDO Leader / MDO Admin users found for this organisation",
          "info"
        );
      }
    } catch {
      showSnackbar("Failed to fetch users for organisation", "error");
    } finally {
      setUsersLoading(false);
    }
  };

  // ─── Select user → fetch token ────────────────────────────────────────────

  const handleSelectUser = async (user: MdoUser) => {
    setSelectedUser(user);
    setSelectedUserToken("");
    setTokenLoading(true);
    try {
      const res = await orgStoreUploadService.getTokenForUser(user.userId);
      setSelectedUserToken(res?.token || "");
      if (!res?.token) {
        showSnackbar("Could not retrieve token for selected user.", "info");
      }
    } catch {
      showSnackbar("Could not retrieve token for selected user.", "error");
    } finally {
      setTokenLoading(false);
    }
  };

  // ─── Other Org Upload ─────────────────────────────────────────────────────

  const handleOtherUpload = async () => {
    if (!otherFile) {
      showSnackbar("Please select a file first", "error");
      return;
    }
    if (!selectedUser || !selectedUserToken) {
      showSnackbar("Please select an MDO user first", "error");
      return;
    }
    setOtherUploading(true);
    setOtherResult(null);
    try {
      const result = await orgStoreUploadService.upload(
        otherFile,
        selectedUserToken
      );
      setOtherResult(result);
      showSnackbar(
        `File uploaded successfully for ${selectedOrg?.orgName}!`,
        "success"
      );
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message || err?.message || "Upload failed",
        "error"
      );
    } finally {
      setOtherUploading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Org Store Upload
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload assets to the organisation store. Use the <b>KB Org</b> tab to
        upload with your own session, or the <b>Other Org</b> tab to upload on
        behalf of an MDO Leader / MDO Admin of another organisation.
      </Typography>

      <Card elevation={2}>
        <CardContent sx={{ p: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
          >
            <Tab label="KB Org" />
            <Tab label="Other Org" />
          </Tabs>

          {/* ── KB Org Tab ── */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ px: 3, pb: 3 }}>
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Upload Asset — KB Org
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                The upload uses your current session token.
              </Typography>

              <FilePicker
                file={kbFile}
                previewUrl={kbPreview}
                onFileSelect={handleKbFileSelect}
                onClear={() => {
                  setKbFile(null);
                  setKbPreview(null);
                  setKbResult(null);
                }}
              />

              <Box
                sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}
              >
                <Button
                  variant="contained"
                  startIcon={
                    kbUploading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <CloudUploadIcon />
                    )
                  }
                  disabled={!kbFile || kbUploading}
                  onClick={handleKbUpload}
                >
                  {kbUploading ? "Uploading…" : "Upload"}
                </Button>
              </Box>

              {kbResult && <UploadResultDisplay result={kbResult} />}
            </Box>
          </TabPanel>

          {/* ── Other Org Tab ── */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ px: 3, pb: 3 }}>
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Upload Asset — Other Org
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Search for an organisation, pick an MDO Leader / MDO Admin,
                then upload the asset on their behalf.
              </Typography>

              <Grid container spacing={3}>
                {/* Step 1: Select organisation */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <StepBadge step={1} active />
                      Select Organisation
                    </Typography>

                    <Autocomplete
                      options={orgOptions}
                      loading={orgLoading}
                      getOptionLabel={(o) => o.orgName}
                      isOptionEqualToValue={(a, b) =>
                        a.identifier === b.identifier
                      }
                      inputValue={orgSearch}
                      onInputChange={(_, val) => {
                        setOrgSearch(val);
                        searchOrganisations(val);
                      }}
                      onChange={(_, val) => {
                        setSelectedOrg(val);
                        if (val) fetchMdoUsers(val.identifier);
                        else {
                          setMdoUsers([]);
                          setSelectedUser(null);
                          setSelectedUserToken("");
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Search organisation"
                          size="small"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <SearchIcon
                                  fontSize="small"
                                  sx={{ mr: 0.5, color: "text.secondary" }}
                                />
                                {params.InputProps.startAdornment}
                              </>
                            ),
                            endAdornment: (
                              <>
                                {orgLoading ? (
                                  <CircularProgress size={16} />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />

                    {selectedOrg && (
                      <Alert severity="success" sx={{ mt: 1 }} icon={false}>
                        <strong>Selected:</strong> {selectedOrg.orgName}
                      </Alert>
                    )}
                  </Paper>
                </Grid>

                {/* Step 2: Select MDO user */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, minHeight: 140 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <StepBadge step={2} active={!!selectedOrg} />
                      Select MDO Leader / MDO Admin
                    </Typography>

                    {!selectedOrg && (
                      <Typography variant="body2" color="text.secondary">
                        Search an organisation first.
                      </Typography>
                    )}

                    {selectedOrg && usersLoading && <LinearProgress />}

                    {selectedOrg &&
                      !usersLoading &&
                      mdoUsers.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          No MDO Leader / MDO Admin found.
                        </Typography>
                      )}

                    {mdoUsers.length > 0 && (
                      <List dense disablePadding sx={{ maxHeight: 250, overflow: "auto" }}>
                        {mdoUsers.map((user) => {
                          const isSelected =
                            selectedUser?.userId === user.userId;
                          return (
                            <ListItemButton
                              key={user.userId}
                              selected={isSelected}
                              onClick={() => handleSelectUser(user)}
                              sx={{
                                borderRadius: 1,
                                mb: 0.5,
                                border: isSelected
                                  ? "1px solid"
                                  : "1px solid transparent",
                                borderColor: isSelected
                                  ? "primary.main"
                                  : "transparent",
                              }}
                            >
                              <ListItemAvatar>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  <PersonIcon fontSize="small" />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                  user.userName
                                }
                                secondary={user.email || user.userName}
                                primaryTypographyProps={{ variant: "body2" }}
                                secondaryTypographyProps={{
                                  variant: "caption",
                                }}
                              />
                              {isSelected && (
                                <CheckCircleOutlineIcon
                                  fontSize="small"
                                  color="primary"
                                />
                              )}
                            </ListItemButton>
                          );
                        })}
                      </List>
                    )}

                    {tokenLoading && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 1,
                        }}
                      >
                        <CircularProgress size={14} />
                        <Typography variant="caption" color="text.secondary">
                          Fetching user token…
                        </Typography>
                      </Box>
                    )}

                    {selectedUser && selectedUserToken && !tokenLoading && (
                      <Alert severity="success" sx={{ mt: 1 }} icon={false}>
                        <strong>Token ready</strong> for{" "}
                        {selectedUser.firstName || selectedUser.userName}
                      </Alert>
                    )}
                  </Paper>
                </Grid>

                {/* Step 3: Upload */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <StepBadge
                        step={3}
                        active={!!(selectedUser && selectedUserToken)}
                      />
                      Upload Asset
                    </Typography>

                    {!(selectedUser && selectedUserToken) && (
                      <Typography variant="body2" color="text.secondary">
                        Select an organisation and an MDO user first.
                      </Typography>
                    )}

                    {selectedUser && selectedUserToken && (
                      <>
                        <FilePicker
                          file={otherFile}
                          previewUrl={otherPreview}
                          onFileSelect={handleOtherFileSelect}
                          onClear={() => {
                            setOtherFile(null);
                            setOtherPreview(null);
                            setOtherResult(null);
                          }}
                        />

                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Button
                            variant="contained"
                            startIcon={
                              otherUploading ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <CloudUploadIcon />
                              )
                            }
                            disabled={
                              !otherFile ||
                              otherUploading ||
                              !selectedUserToken
                            }
                            onClick={handleOtherUpload}
                          >
                            {otherUploading ? "Uploading…" : "Upload"}
                          </Button>
                        </Box>

                        {otherResult && (
                          <UploadResultDisplay
                            result={otherResult}
                            label={`Upload successful for ${selectedOrg?.orgName}!`}
                          />
                        )}
                      </>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrgStoreUpload;
