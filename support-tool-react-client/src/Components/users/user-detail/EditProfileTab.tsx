import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid,
  CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem,
  Autocomplete, InputAdornment, Divider, Accordion, AccordionSummary,
  AccordionDetails, Collapse,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import BadgeIcon from '@mui/icons-material/Badge';
import InfoIcon from '@mui/icons-material/Info';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { UserProfile } from '../../../types/users';
import { usersService } from '../../../services/users.service';
import { DesignationSelector } from '../list-user/DesignationSelector';
import { useActionInterceptor } from '../../../hooks/useActionInterceptor';

// ===================== Interfaces =====================

interface Designation {
  name: string;
  identifier: string;
}

interface EditProfileTabProps {
  user: UserProfile;
  canWrite: boolean;
  loading: boolean;
  moduleName?: string;
  onSaveSuccess: () => void;
  onToast: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

interface CivilServiceType {
  id: string;
  name: string;
  serviceList: CivilService[];
}

interface CivilService {
  id: string;
  name: string;
  cadreList?: Cadre[];
  cadreControllingAuthority?: string;
  commonBatchStartYear?: number;
  commonBatchEndYear?: number;
  commonBatchExclusionYearList?: number[];
}

interface Cadre {
  id: string;
  name: string;
  startBatchYear: number;
  endBatchYear: number;
  exculsionYearList?: number[];
}

interface MasterLanguage {
  name: string;
}

// ===================== Helpers =====================

function getVal(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// ===================== Constants =====================

const GENDER_OPTIONS = ['Male', 'Female', 'Transgender'];
const CATEGORY_OPTIONS = ['General', 'OBC', 'SC', 'ST'];
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MOBILE_PATTERN = /^[0-9]{10}$/;
const PIN_CODE_PATTERN = /^[0-9]{6}$/;
const EMP_ID_PATTERN = /^[a-zA-Z0-9]+$/;

const CADRE_SERVICES = [
  'Indian Administrative Service (IAS)',
  'Indian Police Service (IPS)',
  'Indian Forest Service (IFoS)'
];

const READONLY_FIELDS: { label: string; path: string }[] = [
  { label: 'User ID', path: 'identifier' },
  { label: 'Username', path: 'userName' },
  { label: 'Organization', path: 'rootOrgName' },
  { label: 'Channel', path: 'channel' },
  { label: 'Root Org ID', path: 'rootOrgId' },
  { label: 'Created Date', path: 'createdDate' },
  { label: 'Last Updated', path: 'updatedDate' },
  { label: 'Email Verified', path: 'emailVerified' },
  { label: 'Phone Verified', path: 'phoneVerified' },
  { label: 'Profile Status', path: 'profileDetails.profileStatus' },
  { label: 'Profile Group Status', path: 'profileDetails.profileGroupStatus' },
  { label: 'Profile Designation Status', path: 'profileDetails.profileDesignationStatus' },
  { label: 'Department', path: 'profileDetails.employmentDetails.departmentName' },
];

// ===================== Styles =====================

const sectionHeaderSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  mb: 2,
  pb: 1,
  borderBottom: '2px solid',
  borderColor: 'primary.light',
};

const modifiedInputSx = (modified: boolean): Record<string, any> =>
  modified
    ? { '& .MuiOutlinedInput-root fieldset': { borderColor: 'warning.main', borderWidth: 2 } }
    : {};

// ===================== Component =====================

export const EditProfileTab: React.FC<EditProfileTabProps> = ({
  user, canWrite, loading: externalLoading, moduleName, onSaveSuccess, onToast
}) => {

  // ─── Build form values from user data ───
  const buildFormValues = useCallback((u: UserProfile) => {
    const pd = (u as any).profileDetails || {};
    const personal = pd.personalDetails || {};
    const additional = pd.additionalProperties || {};
    const cadre = pd.cadreDetails || {};
    const prof = pd.professionalDetails?.[0] || {};

    return {
      // Personal
      firstName: u.firstName || '',
      primaryEmail: personal.primaryEmail || '',
      mobile: personal.mobile != null ? String(personal.mobile) : '',
      gender: (u as any).gender || '',
      dob: (u as any).dob || '',
      category: personal.category || '',
      pinCode: personal.pinCode || '',
      employeeCode: personal.employeeCode || '',
      domicileMedium: personal.domicileMedium || '',
      // Professional
      group: prof.group || '',
      designation: prof.designation || '',
      // Additional (editable)
      externalSystemId: additional.externalSystemId || '',
      externalSystem: additional.externalSystem || '',
      // Additional (read-only)
      externalSystemDor: additional.externalSystemDor || '',
      // Cadre
      isCadre: personal.isCadre === false
        ? false
        : (personal.isCadre === true || personal.isCadre === 'true' || !!cadre.civilServiceType),
      civilServiceType: cadre.civilServiceType || '',
      civilServiceName: cadre.civilServiceName || '',
      cadreName: cadre.cadreName || '',
      cadreBatch: cadre.cadreBatch != null ? String(cadre.cadreBatch) : '',
      isOnCentralDeputation: cadre.isOnCentralDeputation === true,
      civilServiceTypeId: cadre.civilServiceTypeId || '',
      civilServiceId: cadre.civilServiceId || '',
      cadreId: cadre.cadreId || '',
      cadreControllingAuthorityName: cadre.cadreControllingAuthorityName || '',
    };
  }, []);

  const [form, setForm] = useState(() => buildFormValues(user));
  const [original, setOriginal] = useState(() => buildFormValues(user));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Group & Designation
  const [groupOptions, setGroupOptions] = useState<string[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<Designation | null>(() => {
    const d = (user.profileDetails as any)?.professionalDetails?.[0]?.designation;
    return d ? { name: d, identifier: '' } : null;
  });

  // Cadre & Languages
  const [cadreConfig, setCadreConfig] = useState<any>(null);
  const [cadreLoading, setCadreLoading] = useState(false);
  const [masterLanguages, setMasterLanguages] = useState<MasterLanguage[]>([]);
  const [languagesLoading, setLanguagesLoading] = useState(false);

  // Pending workflow
  const hasPendingGroupRequest = !!(user as any)?.wfProfileGroupRequest && Object.keys((user as any).wfProfileGroupRequest).length > 0;
  const hasPendingDesignationRequest = !!(user as any)?.wfProfileDesignationRequest && Object.keys((user as any).wfProfileDesignationRequest).length > 0;
  const hasPendingTransferRequest = !!(user as any)?.wfTransferRequest && Object.keys((user as any).wfTransferRequest).length > 0;
  const hasAnyPendingRequest = hasPendingGroupRequest || hasPendingDesignationRequest || hasPendingTransferRequest;

  // ─── Sync when user prop changes ───
  useEffect(() => {
    const v = buildFormValues(user);
    setForm(v);
    setOriginal(v);
    setErrors({});
    const d = (user.profileDetails as any)?.professionalDetails?.[0]?.designation;
    setSelectedDesignation(d ? { name: d, identifier: '' } : null);
  }, [user, buildFormValues]);

  // ─── Fetch options ───
  useEffect(() => {
    (async () => {
      setGroupLoading(true);
      try {
        const resp = await usersService.fetchGroups();
        setGroupOptions(resp.result?.response || []);
      } catch { setGroupOptions([]); }
      finally { setGroupLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setCadreLoading(true);
      try {
        const resp = await usersService.fetchCadreData();
        const configValue = resp?.result?.response?.value;
        setCadreConfig(configValue?.civilServiceType || configValue || null);
      } catch { setCadreConfig(null); }
      finally { setCadreLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLanguagesLoading(true);
      try {
        const resp = await usersService.fetchMasterLanguages();
        setMasterLanguages(resp?.languages || resp?.result?.languages || []);
      } catch { setMasterLanguages([]); }
      finally { setLanguagesLoading(false); }
    })();
  }, []);

  // ─── Cadre cascading data ───
  const civilServiceTypes: string[] = useMemo(() => {
    if (!cadreConfig?.civilServiceTypeList) return [];
    return cadreConfig.civilServiceTypeList.map((s: CivilServiceType) => s.name);
  }, [cadreConfig]);

  const selectedServiceType: CivilServiceType | null = useMemo(() => {
    if (!cadreConfig?.civilServiceTypeList || !form.civilServiceType) return null;
    return cadreConfig.civilServiceTypeList.find((s: CivilServiceType) => s.name === form.civilServiceType) || null;
  }, [cadreConfig, form.civilServiceType]);

  const serviceNamesList: string[] = useMemo(() => {
    if (!selectedServiceType?.serviceList) return [];
    return selectedServiceType.serviceList.map((s: CivilService) => s.name);
  }, [selectedServiceType]);

  const selectedService: CivilService | null = useMemo(() => {
    if (!selectedServiceType?.serviceList || !form.civilServiceName) return null;
    return selectedServiceType.serviceList.find((s: CivilService) => s.name === form.civilServiceName) || null;
  }, [selectedServiceType, form.civilServiceName]);

  const cadreList: string[] = useMemo(() => {
    if (!selectedService?.cadreList) return [];
    return selectedService.cadreList.map((c: Cadre) => c.name);
  }, [selectedService]);

  const selectedCadre: Cadre | null = useMemo(() => {
    if (!selectedService?.cadreList || !form.cadreName) return null;
    return selectedService.cadreList.find((c: Cadre) => c.name === form.cadreName) || null;
  }, [selectedService, form.cadreName]);

  const yearArray: number[] = useMemo(() => {
    let startYear: number | undefined;
    let endYear: number | undefined;
    let exclusionYears: number[] = [];
    if (selectedCadre) {
      startYear = selectedCadre.startBatchYear;
      endYear = selectedCadre.endBatchYear;
      exclusionYears = selectedCadre.exculsionYearList || [];
    } else if (selectedService && (!selectedService.cadreList || selectedService.cadreList.length === 0)) {
      startYear = selectedService.commonBatchStartYear;
      endYear = selectedService.commonBatchEndYear;
      exclusionYears = selectedService.commonBatchExclusionYearList || [];
    }
    if (startYear == null || endYear == null) return [];
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear! + i)
      .filter(y => !exclusionYears.includes(y));
  }, [selectedCadre, selectedService]);

  const cadreControllingAuthority: string = useMemo(() => {
    if (selectedService?.cadreControllingAuthority) return selectedService.cadreControllingAuthority;
    return form.cadreControllingAuthorityName || '';
  }, [selectedService, form.cadreControllingAuthorityName]);

  const showCadreDropdown = useMemo(() =>
    form.isCadre && !!form.civilServiceType && !!form.civilServiceName && CADRE_SERVICES.includes(form.civilServiceName),
    [form.isCadre, form.civilServiceType, form.civilServiceName]);

  const showBatchDropdown = useMemo(() => {
    if (!form.isCadre || !form.civilServiceType || !form.civilServiceName) return false;
    return CADRE_SERVICES.includes(form.civilServiceName) ? !!form.cadreName : true;
  }, [form.isCadre, form.civilServiceType, form.civilServiceName, form.cadreName]);

  const showControllingAuthority = form.isCadre && !!form.cadreBatch;
  const showCentralDeputation = useMemo(() =>
    form.isCadre && form.civilServiceType === 'All India Services' && !!form.cadreName && !!form.cadreBatch,
    [form.isCadre, form.civilServiceType, form.cadreName, form.cadreBatch]);

  // ─── Field handlers ───
  const formDataRef = React.useRef<any>({});

  const handleChange = (key: string, value: any) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      // Cascading resets
      if (key === 'isCadre' && !value) {
        Object.assign(next, {
          civilServiceType: '', civilServiceName: '', cadreName: '', cadreBatch: '',
          isOnCentralDeputation: false, civilServiceTypeId: '', civilServiceId: '',
          cadreId: '', cadreControllingAuthorityName: '',
        });
      }
      if (key === 'civilServiceType') {
        Object.assign(next, {
          civilServiceName: '', cadreName: '', cadreBatch: '', isOnCentralDeputation: false,
          civilServiceId: '', cadreId: '', cadreControllingAuthorityName: '',
        });
      }
      if (key === 'civilServiceName') {
        Object.assign(next, {
          cadreName: '', cadreBatch: '', isOnCentralDeputation: false,
          cadreId: '', cadreControllingAuthorityName: '',
        });
      }
      if (key === 'cadreName') {
        Object.assign(next, { cadreBatch: '', isOnCentralDeputation: false });
      }
      return next;
    });
    if (errors[key]) setErrors(prev => { const c = { ...prev }; delete c[key]; return c; });
  };

  const handleDesignationChange = (d: Designation | null) => {
    setSelectedDesignation(d);
    handleChange('designation', d?.name || '');
  };

  const handleReset = () => {
    setForm({ ...original });
    setErrors({});
    const d = (user.profileDetails as any)?.professionalDetails?.[0]?.designation;
    setSelectedDesignation(d ? { name: d, identifier: '' } : null);
  };

  // ─── Detect changes ───
  const changedKeys = useMemo(() =>
    Object.keys(form).filter(k => String((form as any)[k] ?? '') !== String((original as any)[k] ?? '')),
    [form, original]);
  const hasChanges = changedKeys.length > 0;

  // ─── Validation ───
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = 'Full Name is required';
    if (form.primaryEmail && !EMAIL_PATTERN.test(form.primaryEmail)) errs.primaryEmail = 'Enter a valid email';
    if (form.mobile && !MOBILE_PATTERN.test(form.mobile)) errs.mobile = 'Enter a valid 10-digit mobile number';
    if (form.pinCode && !PIN_CODE_PATTERN.test(form.pinCode)) errs.pinCode = 'Enter a valid 6-digit pin code';
    if (form.employeeCode && !EMP_ID_PATTERN.test(form.employeeCode)) errs.employeeCode = 'Only alphanumeric characters allowed';
    if (form.isCadre) {
      if (!form.civilServiceType) errs.civilServiceType = 'Type of Civil Services is required';
      if (!form.civilServiceName) errs.civilServiceName = 'Service is required';
      if (showCadreDropdown && !form.cadreName) errs.cadreName = 'Cadre is required';
      if (showBatchDropdown && !form.cadreBatch) errs.cadreBatch = 'Batch is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Save ───
  const { handleAction: handleSaveInterceptor } = useActionInterceptor({
    actionType: 'Patch',
    onComplete: (interceptPayload) => executeSave(interceptPayload),
    getPayload: () => ({})
  });

  const handleSave = () => {
    if (!validate()) return;
    if (!hasChanges) { onToast('No changes were made', 'info'); return; }
    formDataRef.current = { ...form };
    handleSaveInterceptor();
  };

  const executeSave = async (interceptPayload: any) => {
    setSaving(true);
    try {
      const f = formDataRef.current;
      const changedFieldsSummary: Record<string, { original: string; new: string }> = {};

      // Determine what changed by category
      const personalKeys = ['firstName', 'primaryEmail', 'mobile', 'gender', 'dob', 'category', 'pinCode', 'employeeCode', 'domicileMedium', 'externalSystemId', 'externalSystem'];
      const personalChanged: string[] = [];
      personalKeys.forEach(k => {
        if (String(f[k] ?? '') !== String((original as any)[k] ?? '')) {
          personalChanged.push(k);
          changedFieldsSummary[k] = { original: String((original as any)[k] || ''), new: String(f[k] || '') };
        }
      });

      const professionalChanged: string[] = [];
      if (f.group !== original.group) {
        professionalChanged.push('group');
        changedFieldsSummary['Group'] = { original: original.group, new: f.group };
      }
      if (f.designation !== original.designation) {
        professionalChanged.push('designation');
        changedFieldsSummary['Designation'] = { original: original.designation, new: f.designation };
      }

      const cadreChanged = (
        String(f.isCadre) !== String(original.isCadre) ||
        f.civilServiceType !== original.civilServiceType ||
        f.civilServiceName !== original.civilServiceName ||
        f.cadreName !== original.cadreName ||
        String(f.cadreBatch) !== String(original.cadreBatch) ||
        String(f.isOnCentralDeputation) !== String(original.isOnCentralDeputation)
      );
      if (cadreChanged) {
        changedFieldsSummary['Cadre Details'] = {
          original: original.civilServiceName ? `${original.civilServiceType} / ${original.civilServiceName}` : 'None',
          new: f.civilServiceName ? `${f.civilServiceType} / ${f.civilServiceName}` : 'None'
        };
      }

      // --- 1) Build the updateUser payload for personal/additional ---
      if (personalChanged.length > 0) {
        // Deep clone existing profileDetails to preserve all existing data
        const existingPD = JSON.parse(JSON.stringify((user as any).profileDetails || {}));

        // Ensure nested objects exist
        if (!existingPD.personalDetails) existingPD.personalDetails = {};
        if (!existingPD.additionalProperties) existingPD.additionalProperties = {};

        const updatePayload: any = {
          request: {
            userId: user.identifier,
            profileDetails: existingPD,
          }
        };

        // Top-level user fields
        if (f.firstName !== original.firstName) {
          updatePayload.request.firstName = f.firstName;
          updatePayload.request.profileDetails.personalDetails.firstname = f.firstName;
        }
        if (f.primaryEmail !== original.primaryEmail) {
          updatePayload.request.email = f.primaryEmail;
          updatePayload.request.profileDetails.personalDetails.primaryEmail = f.primaryEmail;
        }
        if (f.mobile !== original.mobile) {
          updatePayload.request.phone = f.mobile;
          updatePayload.request.profileDetails.personalDetails.mobile = f.mobile;
        }
        if (f.gender !== original.gender) {
          updatePayload.request.gender = f.gender || null;
        }
        if (f.dob !== original.dob) {
          updatePayload.request.dob = f.dob || null;
        }

        // Personal details sub-fields
        ['category', 'pinCode', 'employeeCode', 'domicileMedium'].forEach(k => {
          if (String(f[k] ?? '') !== String((original as any)[k] ?? '')) {
            updatePayload.request.profileDetails.personalDetails[k] = f[k] || '';
          }
        });

        // Additional properties
        if (f.externalSystemId !== original.externalSystemId) {
          updatePayload.request.profileDetails.additionalProperties.externalSystemId = f.externalSystemId;
        }
        if (f.externalSystem !== original.externalSystem) {
          updatePayload.request.profileDetails.additionalProperties.externalSystem = f.externalSystem;
        }

        // Clean up internal flags that should not be sent
        if (updatePayload.request.profileDetails?.verifiedKarmayogi) {
          delete updatePayload.request.profileDetails.verifiedKarmayogi;
        }
        if (updatePayload.request.profileDetails?.professionalDetails?.[0]?.verifiedKarmayogi) {
          delete updatePayload.request.profileDetails.professionalDetails[0].verifiedKarmayogi;
        }

        const request = {
          payload: updatePayload,
          changedFields: changedFieldsSummary,
          userId: user.identifier,
          jiraLink: interceptPayload?.jiraLink || '',
          module: moduleName || 'users',
        };

        const response: any = await usersService.updateUser(request);
        if (!response || response.responseCode !== 'OK') {
          throw new Error(response?.responseMessage || 'Failed to update user details');
        }
      }

      // --- 2) Cadre details (minimal payload) ---
      if (cadreChanged) {
        const cadrePayload: any = {
          request: {
            userId: user.identifier,
            profileDetails: {
              personalDetails: { isCadre: !!f.isCadre },
            }
          }
        };

        if (f.isCadre && f.civilServiceType && f.civilServiceName) {
          cadrePayload.request.profileDetails.cadreDetails = {
            civilServiceTypeId: selectedServiceType?.id || f.civilServiceTypeId || '',
            civilServiceType: f.civilServiceType,
            civilServiceId: selectedService?.id || f.civilServiceId || '',
            civilServiceName: f.civilServiceName,
            cadreId: selectedCadre?.id || f.cadreId || null,
            cadreName: f.cadreName || null,
            cadreBatch: f.cadreBatch ? Number(f.cadreBatch) : null,
            cadreControllingAuthorityName: cadreControllingAuthority || f.cadreControllingAuthorityName || null,
            isOnCentralDeputation: f.isOnCentralDeputation || false,
          };
        } else {
          // Explicitly clear stale cadreDetails when disabling cadre
          cadrePayload.request.profileDetails.cadreDetails = null;
        }

        const cadreRequest = {
          payload: cadrePayload,
          changedFields: changedFieldsSummary,
          userId: user.identifier,
          jiraLink: interceptPayload?.jiraLink || '',
          module: moduleName || 'users',
        };

        const cadreResponse: any = await usersService.updateUser(cadreRequest);
        if (!cadreResponse || cadreResponse.responseCode !== 'OK') {
          throw new Error(cadreResponse?.responseMessage || 'Failed to update cadre details');
        }
      }

      // --- 3) Professional details via updateUserExt ---
      if (professionalChanged.length > 0) {
        const existingProf = (user.profileDetails as any)?.professionalDetails?.[0] || {};
        const extPayload = {
          request: {
            userId: user.identifier,
            profileDetails: {
              professionalDetails: [{
                ...existingProf,
                group: f.group,
                designation: f.designation,
              }]
            }
          }
        };
        // Remove internal flags
        if (extPayload.request.profileDetails.professionalDetails[0]?.verifiedKarmayogi) {
          delete extPayload.request.profileDetails.professionalDetails[0].verifiedKarmayogi;
        }

        const extRequest = {
          payload: extPayload,
          jiraLink: interceptPayload?.jiraLink || '',
          changedFields: changedFieldsSummary,
          module: moduleName || 'users',
          userId: user.identifier,
        };
        await usersService.updateUserExt(extRequest);
      }

      onToast('Profile updated successfully', 'success');
      onSaveSuccess();
    } catch (error: any) {
      const message = error?.response?.data?.error?.params?.errmsg || error.message || 'An error occurred while saving';
      onToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render helpers ───
  const isModified = (key: string) => String((form as any)[key] ?? '') !== String((original as any)[key] ?? '');
  const isProcessing = saving || externalLoading;

  // Keep isModified in a ref so Field's stable component reference can read the latest value
  const isModifiedRef = React.useRef(isModified);
  isModifiedRef.current = isModified;

  // Stable Field component — same reference across renders so React reconciles instead of remounting
  const Field = useMemo(() => {
    const FieldComponent: React.FC<{ fieldKey: string; children: React.ReactNode; sm?: number }> = ({ fieldKey, children, sm = 6 }) => (
      <Grid item xs={12} sm={sm}>
        {children}
        {isModifiedRef.current(fieldKey) && (
          <Typography variant="caption" sx={{ color: 'warning.main', fontSize: '0.65rem', mt: 0.25, display: 'block' }}>
            • Modified
          </Typography>
        )}
      </Grid>
    );
    FieldComponent.displayName = 'Field';
    return FieldComponent;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderReadOnlyField = (label: string, path: string) => {
    let val = getVal(user, path);
    if (val === true) val = 'Yes';
    if (val === false) val = 'No';
    if (val == null || val === '') val = '-';
    if (typeof val === 'object') val = JSON.stringify(val);
    return (
      <Box key={path}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{
          fontFamily: (label === 'User ID' || label === 'Root Org ID') ? 'monospace' : 'inherit',
          fontSize: '0.85rem', mt: 0.25,
        }}>
          {String(val)}
        </Typography>
      </Box>
    );
  };

  const renderStaticField = (label: string, value: string) => (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.25 }}>{value || 'NA'}</Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      {/* ── Unsaved Changes Banner ── */}
      <Collapse in={hasChanges}>
        <Alert
          severity="warning"
          icon={<WarningAmberIcon fontSize="small" />}
          sx={{ mb: 2.5, borderRadius: 2, '& .MuiAlert-action': { pt: 0 } }}
          action={
            <Box display="flex" gap={1} alignItems="center">
              <Button size="small" startIcon={<UndoIcon />} onClick={handleReset}
                disabled={isProcessing} sx={{ textTransform: 'none' }}>
                Reset
              </Button>
              <Button size="small" variant="contained" disableElevation
                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                onClick={handleSave} disabled={isProcessing}
                sx={{ textTransform: 'none', borderRadius: 1.5 }}>
                {saving ? 'Saving...' : `Save ${changedKeys.length} Change${changedKeys.length > 1 ? 's' : ''}`}
              </Button>
            </Box>
          }
        >
          You have unsaved changes ({changedKeys.length} field{changedKeys.length > 1 ? 's' : ''} modified)
        </Alert>
      </Collapse>

      {hasAnyPendingRequest && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
          {hasPendingTransferRequest
            ? 'A transfer request is pending with the MDO. Some fields may be disabled until resolved.'
            : `A request to update the user's ${[hasPendingGroupRequest && 'group', hasPendingDesignationRequest && 'designation'].filter(Boolean).join(' and ')} is pending.`}
        </Alert>
      )}

      {/* ════════════════════ PERSONAL DETAILS ════════════════════ */}
      <Paper variant="outlined" sx={{ p: 3, mb: 2.5, borderRadius: 2 }}>
        <Box sx={sectionHeaderSx}>
          <PersonIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>Personal Details</Typography>
        </Box>

        <Grid container spacing={2.5}>
          {/* Full Name */}
          <Field fieldKey="firstName">
            <TextField fullWidth size="small" label="Full Name" required
              value={form.firstName} onChange={e => handleChange('firstName', e.target.value)}
              disabled={!canWrite || saving} error={!!errors.firstName} helperText={errors.firstName}
              sx={modifiedInputSx(isModified('firstName'))} />
          </Field>

          {/* Email */}
          <Field fieldKey="primaryEmail">
            <TextField fullWidth size="small" label="Email" type="email"
              value={form.primaryEmail} onChange={e => handleChange('primaryEmail', e.target.value)}
              disabled={!canWrite || saving} error={!!errors.primaryEmail} helperText={errors.primaryEmail}
              sx={modifiedInputSx(isModified('primaryEmail'))} />
          </Field>

          {/* Gender */}
          <Field fieldKey="gender">
            <FormControl fullWidth size="small" disabled={!canWrite || saving}>
              <InputLabel>Gender</InputLabel>
              <Select value={form.gender} label="Gender" onChange={e => handleChange('gender', e.target.value)}
                sx={modifiedInputSx(isModified('gender'))}>
                <MenuItem value="">Not specified</MenuItem>
                {GENDER_OPTIONS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </Select>
            </FormControl>
          </Field>

          {/* Date of Birth */}
          <Field fieldKey="dob">
            <TextField fullWidth size="small" label="Date of Birth" type="date"
              value={form.dob} onChange={e => handleChange('dob', e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().split('T')[0] }}
              disabled={!canWrite || saving}
              sx={modifiedInputSx(isModified('dob'))} />
          </Field>

          {/* Category */}
          <Field fieldKey="category">
            <FormControl fullWidth size="small" disabled={!canWrite || saving}>
              <InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category" onChange={e => handleChange('category', e.target.value)}
                sx={modifiedInputSx(isModified('category'))}>
                <MenuItem value="">Not specified</MenuItem>
                {CATEGORY_OPTIONS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Field>

          {/* Office Pin Code */}
          <Field fieldKey="pinCode">
            <TextField fullWidth size="small" label="Office Pin Code"
              value={form.pinCode} onChange={e => handleChange('pinCode', e.target.value)}
              inputProps={{ maxLength: 6 }}
              disabled={!canWrite || saving} error={!!errors.pinCode} helperText={errors.pinCode}
              sx={modifiedInputSx(isModified('pinCode'))} />
          </Field>

          {/* Mobile Number */}
          <Field fieldKey="mobile">
            <TextField fullWidth size="small" label="Mobile Number"
              value={form.mobile} onChange={e => handleChange('mobile', e.target.value)}
              inputProps={{ maxLength: 10 }}
              InputProps={{ startAdornment: <InputAdornment position="start">+91</InputAdornment> }}
              disabled={!canWrite || saving} error={!!errors.mobile} helperText={errors.mobile}
              sx={modifiedInputSx(isModified('mobile'))} />
          </Field>

          {/* Mother Tongue */}
          <Field fieldKey="domicileMedium">
            <Autocomplete
              freeSolo
              options={masterLanguages.map(l => l.name)}
              loading={languagesLoading}
              value={form.domicileMedium || null}
              inputValue={form.domicileMedium}
              onInputChange={(_e, val) => handleChange('domicileMedium', val)}
              onChange={(_e, val) => handleChange('domicileMedium', val || '')}
              disabled={!canWrite || saving}
              renderInput={(params) => (
                <TextField {...params} size="small" label="Mother Tongue"
                  sx={modifiedInputSx(isModified('domicileMedium'))} />
              )}
            />
          </Field>

          {/* Employee ID */}
          <Field fieldKey="employeeCode">
            <TextField fullWidth size="small" label="Employee ID"
              value={form.employeeCode} onChange={e => handleChange('employeeCode', e.target.value)}
              disabled={!canWrite || saving} error={!!errors.employeeCode} helperText={errors.employeeCode}
              sx={modifiedInputSx(isModified('employeeCode'))} />
          </Field>

          {/* eHRMS ID - Read only */}
          <Grid item xs={12} sm={6}>
            {renderStaticField('eHRMS ID / External System ID', form.externalSystemId)}
          </Grid>

          {/* Date of Retirement - Read only */}
          <Grid item xs={12}>
            {renderStaticField('Date of Retirement', form.externalSystemDor)}
          </Grid>
        </Grid>
      </Paper>

      {/* ════════════════════ PROFESSIONAL DETAILS ════════════════════ */}
      <Paper variant="outlined" sx={{ p: 3, mb: 2.5, borderRadius: 2 }}>
        <Box sx={sectionHeaderSx}>
          <WorkIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>Professional Details</Typography>
        </Box>

        <Grid container spacing={2.5}>
          {/* Group */}
          <Field fieldKey="group">
            <FormControl fullWidth size="small" required error={!!errors.group}
              disabled={!canWrite || saving || groupLoading || hasPendingGroupRequest || hasPendingTransferRequest}>
              <InputLabel>Group</InputLabel>
              <Select value={form.group} label="Group"
                onChange={e => handleChange('group', e.target.value)}
                sx={modifiedInputSx(isModified('group'))}>
                {groupLoading
                  ? <MenuItem value="" disabled><CircularProgress size={18} sx={{ mr: 1 }} /> Loading...</MenuItem>
                  : groupOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)
                }
              </Select>
              {errors.group && <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>{errors.group}</Typography>}
            </FormControl>
          </Field>

          {/* Designation */}
          <Field fieldKey="designation">
            <DesignationSelector
              user={user}
              selectedDesignation={selectedDesignation}
              onDesignationSelect={handleDesignationChange}
              error={!!errors.designation}
              disabled={!canWrite || saving || hasPendingDesignationRequest || hasPendingTransferRequest}
            />
          </Field>

          {/* Department (Read-Only) */}
          <Grid item xs={12} sm={6}>
            {renderReadOnlyField('Department', 'profileDetails.employmentDetails.departmentName')}
          </Grid>
        </Grid>
      </Paper>

      {/* ════════════════════ CADRE / CIVIL SERVICE ════════════════════ */}
      <Paper variant="outlined" sx={{ p: 3, mb: 2.5, borderRadius: 2 }}>
        <Box sx={sectionHeaderSx}>
          <AccountBalanceIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>Cadre / Civil Service Details</Typography>
          {cadreLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </Box>

        <Grid container spacing={2.5}>
          {/* Organized service? */}
          <Field fieldKey="isCadre">
            <FormControl fullWidth size="small" disabled={!canWrite || saving}>
              <InputLabel>Are you from any organized service of the government?</InputLabel>
              <Select
                value={form.isCadre === true ? 'true' : 'false'}
                label="Are you from any organized service of the government?"
                onChange={e => handleChange('isCadre', e.target.value === 'true')}
                sx={modifiedInputSx(isModified('isCadre'))}>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Field>

          {form.isCadre && (
            <>
          {/* Type of Civil Services */}
          {form.isCadre && (
            <Field fieldKey="civilServiceType">
              <FormControl fullWidth size="small" required error={!!errors.civilServiceType}
                disabled={!canWrite || saving || cadreLoading}>
                <InputLabel>Type of Civil Services</InputLabel>
                <Select value={form.civilServiceType} label="Type of Civil Services"
                  onChange={e => handleChange('civilServiceType', e.target.value)}
                  sx={modifiedInputSx(isModified('civilServiceType'))}>
                  {civilServiceTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
                {errors.civilServiceType && <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>{errors.civilServiceType}</Typography>}
              </FormControl>
            </Field>
          )}

          {/* Services */}
          {form.isCadre && form.civilServiceType && (
            <Field fieldKey="civilServiceName">
              <FormControl fullWidth size="small" required error={!!errors.civilServiceName}
                disabled={!canWrite || saving}>
                <InputLabel>Services</InputLabel>
                <Select value={form.civilServiceName} label="Services"
                  onChange={e => handleChange('civilServiceName', e.target.value)}
                  sx={modifiedInputSx(isModified('civilServiceName'))}>
                  {serviceNamesList.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
                {errors.civilServiceName && <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>{errors.civilServiceName}</Typography>}
              </FormControl>
            </Field>
          )}

          {/* Cadre (IAS/IPS/IFoS only) */}
          {showCadreDropdown && (
            <Field fieldKey="cadreName">
              <FormControl fullWidth size="small" required error={!!errors.cadreName}
                disabled={!canWrite || saving}>
                <InputLabel>Cadre</InputLabel>
                <Select value={form.cadreName} label="Cadre"
                  onChange={e => handleChange('cadreName', e.target.value)}
                  sx={modifiedInputSx(isModified('cadreName'))}>
                  {cadreList.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
                {errors.cadreName && <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>{errors.cadreName}</Typography>}
              </FormControl>
            </Field>
          )}

          {/* Batch */}
          {showBatchDropdown && (
            <Field fieldKey="cadreBatch">
              <FormControl fullWidth size="small" required error={!!errors.cadreBatch}
                disabled={!canWrite || saving}>
                <InputLabel>Batch</InputLabel>
                <Select value={form.cadreBatch} label="Batch"
                  onChange={e => handleChange('cadreBatch', e.target.value)}
                  sx={modifiedInputSx(isModified('cadreBatch'))}>
                  {yearArray.map(y => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
                </Select>
                {errors.cadreBatch && <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>{errors.cadreBatch}</Typography>}
              </FormControl>
            </Field>
          )}

          {/* Controlling Authority */}
          {showControllingAuthority && cadreControllingAuthority && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid', borderColor: 'grey.200' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Cadre Controlling Authority
                </Typography>
                <Typography variant="body2" fontWeight={500} color="primary.main" sx={{ mt: 0.25 }}>
                  {cadreControllingAuthority}
                </Typography>
              </Box>
            </Grid>
          )}

          {/* Central Deputation */}
          {showCentralDeputation && (
            <Field fieldKey="isOnCentralDeputation">
              <FormControl fullWidth size="small" disabled={!canWrite || saving}>
                <InputLabel>Central Deputation</InputLabel>
                <Select
                  value={form.isOnCentralDeputation === true ? 'true' : 'false'}
                  label="Central Deputation"
                  onChange={e => handleChange('isOnCentralDeputation', e.target.value === 'true')}
                  sx={modifiedInputSx(isModified('isOnCentralDeputation'))}>
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Field>
          )}
            </>
          )}

          {!form.isCadre && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ mt: -0.5 }}>
                Select "Yes" above if the user belongs to an organized government service to configure cadre details.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* ════════════════════ ADDITIONAL DETAILS ════════════════════ */}
      <Accordion disableGutters elevation={0} variant="outlined" sx={{ borderRadius: '8px !important', mb: 2.5, '&::before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <BadgeIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600}>Additional Details</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Grid container spacing={2.5}>
            <Field fieldKey="externalSystemId">
              <TextField fullWidth size="small" label="External System ID (eHRMS ID)"
                value={form.externalSystemId}
                onChange={e => handleChange('externalSystemId', e.target.value)}
                disabled={!canWrite || saving}
                helperText="The user's unique ID from an external system like eHRMS."
                sx={modifiedInputSx(isModified('externalSystemId'))} />
            </Field>
            <Field fieldKey="externalSystem">
              <TextField fullWidth size="small" label="External System Name"
                value={form.externalSystem}
                onChange={e => handleChange('externalSystem', e.target.value)}
                disabled={!canWrite || saving}
                helperText="If not present, check with the user and add or update it."
                sx={modifiedInputSx(isModified('externalSystem'))} />
            </Field>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* ════════════════════ SYSTEM INFORMATION ════════════════════ */}
      <Accordion disableGutters elevation={0} variant="outlined" sx={{ borderRadius: '8px !important', mb: 2.5, '&::before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon color="action" fontSize="small" />
            <Typography variant="subtitle1" fontWeight={600} color="text.secondary">System Information (Read-Only)</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Grid container spacing={2}>
            {READONLY_FIELDS.map(f => (
              <Grid item xs={12} sm={6} md={4} key={f.path}>
                {renderReadOnlyField(f.label, f.path)}
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* ════════════════════ BOTTOM ACTION BAR ════════════════════ */}
      <Divider sx={{ mb: 2.5 }} />
      <Box display="flex" justifyContent="center" gap={2} pb={2}>
        <Button variant="outlined" startIcon={<UndoIcon />} size="large"
          onClick={handleReset} disabled={!hasChanges || isProcessing}
          sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
          Reset All Changes
        </Button>
        <Button variant="contained" size="large" disableElevation
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave} disabled={!hasChanges || isProcessing || !canWrite}
          sx={{ textTransform: 'none', borderRadius: 2, px: 4 }}>
          {saving ? 'Saving Changes...' : 'Save All Changes'}
        </Button>
      </Box>
    </Box>
  );
};
