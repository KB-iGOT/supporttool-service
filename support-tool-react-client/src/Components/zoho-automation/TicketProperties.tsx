import React, { useState, useEffect, useCallback } from 'react';
import { TicketDetails } from '../../services/zoho.service';

interface TicketPropertiesProps {
    ticketDetails: TicketDetails;
    formFields?: any;
    onSave?: (modifiedFields: any) => Promise<void>;
}

const TicketProperties: React.FC<TicketPropertiesProps> = ({ ticketDetails, formFields, onSave }) => {
    // Edit mode state
    const [isEditMode, setIsEditMode] = useState(false);
    const [modifiedFields, setModifiedFields] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Original values for comparison
    const [originalValues, setOriginalValues] = useState<Record<string, any>>({});

    // Initialize original values when ticket details change
    useEffect(() => {
        const cf = ticketDetails.customFields || {};
        setOriginalValues({
            dueDate: ticketDetails.dueDate || '',
            responseDueDate: ticketDetails.responseDueDate || '',
            requestor: cf.Requestor || '',
            portal: cf.Portal || '',
            ministryState: cf['Ministry/State'] || '',
            departmentName: ticketDetails.departmentName || ticketDetails.department?.name || '',
            organization: cf.Organization || '',
            classifications: ticketDetails.classification || cf.Classifications || '',
            jiraId: cf['Jira ID'] || '',
            categories: cf.Categories || '',
            subCategories: cf['Sub-Categories'] || '',
            priority: ticketDetails.priority || 'P3',
            severity: cf.Severity || 'Sev 3',
            workingTeam: cf['Working team'] || '',
            description: ticketDetails.description || ticketDetails.summary || '',
            language: ticketDetails.language || 'English',
            channel: ticketDetails.channel || 'Email',
        });
        // Reset states when ticket changes
        setModifiedFields({});
        setIsEditMode(false);
    }, [ticketDetails]);

    const hasChanges = Object.keys(modifiedFields).length > 0;

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString().slice(0, 16);
        } catch {
            return '';
        }
    };

    const handleFieldChange = useCallback((field: string, value: any) => {
        if (!isEditMode) return;

        const originalValue = originalValues[field];

        // Only track if value is different from original
        if (value === originalValue || (value === '' && !originalValue)) {
            // Remove from modified if it's back to original
            setModifiedFields(prev => {
                const updated = { ...prev };
                delete updated[field];
                return updated;
            });
        } else {
            setModifiedFields(prev => ({ ...prev, [field]: value }));
        }
    }, [isEditMode, originalValues]);

    const handleEditClick = () => {
        setIsEditMode(true);
    };

    const handleCancelClick = () => {
        setIsEditMode(false);
        setModifiedFields({});
    };

    const handleSaveClick = async () => {
        if (!hasChanges || !onSave) return;

        setIsSaving(true);
        try {
            // Build the payload for Zoho API
            const payload: any = {};
            const cfPayload: any = {};

            // Map modified fields to Zoho API field names
            // IMPORTANT: Zoho's field naming is confusing:
            // - cf_categories = Portal field
            // - cf_categories_1 = Categories field
            Object.entries(modifiedFields).forEach(([field, value]) => {
                switch (field) {
                    case 'dueDate':
                        payload.dueDate = value;
                        break;
                    case 'responseDueDate':
                        payload.responseDueDate = value;
                        break;
                    case 'classifications':
                        payload.classification = value;
                        break;
                    case 'priority':
                        payload.priority = value;
                        break;
                    case 'description':
                        payload.description = value;
                        break;
                    case 'language':
                        payload.language = value;
                        break;
                    case 'channel':
                        payload.channel = value;
                        break;
                    case 'portal':
                        // Portal is stored in cf_categories (Zoho's confusing naming)
                        cfPayload.cf_categories = value;
                        break;
                    case 'categories':
                        // Categories is stored in cf_categories_1
                        cfPayload.cf_categories_1 = value;
                        break;
                    case 'subCategories':
                        cfPayload.cf_sub_categories = value;
                        break;
                    case 'ministryState':
                        cfPayload.cf_ministry_state = value;
                        break;
                    case 'organization':
                        cfPayload.cf_organization = value;
                        break;
                    case 'severity':
                        cfPayload.cf_severity = value;
                        break;
                    case 'jiraId':
                        cfPayload.cf_jira_id = value;
                        break;
                    case 'workingTeam':
                        cfPayload.cf_working_team = value;
                        break;
                    case 'requestor':
                        cfPayload.cf_requestor = value;
                        break;
                    default:
                        break;
                }
            });

            // Add cf object if there are custom field changes
            if (Object.keys(cfPayload).length > 0) {
                payload.cf = cfPayload;
            }

            await onSave(payload);

            // Update original values with new values
            setOriginalValues(prev => ({ ...prev, ...modifiedFields }));
            setModifiedFields({});
            setIsEditMode(false);
        } catch (error) {
            console.error('Failed to save changes:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Helper function to get dropdown options from formFields
    const getFieldOptions = (fieldApiName: string): any[] => {
        if (!formFields?.sections) return [];

        const fieldsArray: any[] = [];
        formFields.sections.forEach((section: any) => {
            if (section.fields && Array.isArray(section.fields)) {
                fieldsArray.push(...section.fields);
            }
        });

        if (!fieldsArray.length) return [];

        let field = fieldsArray.find((f: any) => f.apiName === fieldApiName);
        if (!field) {
            field = fieldsArray.find((f: any) => f.name === fieldApiName || f.displayLabel === fieldApiName);
        }

        return field?.allowedValues || field?.picklist || [];
    };

    // Extract custom fields
    const cf = ticketDetails.customFields || {};

    // Get current value (modified or original)
    const getValue = (field: string, defaultValue: any = '') => {
        return modifiedFields[field] !== undefined ? modifiedFields[field] : originalValues[field] || defaultValue;
    };

    return (
        <div className="ticket-properties-clean">
            <div className="properties-header-clean">
                <h3>Ticket Properties</h3>
                {!isEditMode ? (
                    <button className="edit-icon-btn" title="Edit properties" onClick={handleEditClick}>
                        ✏️
                    </button>
                ) : (
                    <span className="edit-mode-indicator">Editing...</span>
                )}
            </div>

            <div className="properties-scroll-content">
                {/* Contact Info Section */}
                <div className="property-section-clean">
                    <h4 className="section-title">Contact Info</h4>
                    <div className="section-fields">
                        <div className="contact-display">
                            <div className="contact-name-large">
                                {ticketDetails.contact?.lastName || ticketDetails.contactId || 'Unknown'}
                            </div>
                            <div className="contact-email">{ticketDetails.contact?.email || ticketDetails.email || '-'}</div>
                        </div>
                    </div>
                </div>

                {/* Key Information Section */}
                <div className="property-section-clean">
                    <h4 className="section-title">Key Information</h4>
                    <div className="section-fields">
                        {/* Ticket Assigned To */}
                        <div className="field-row">
                            <label className="field-label">Ticket Assigned To</label>
                            <div className="assignee-display">
                                <span className="assignee-avatar">
                                    {ticketDetails.assignee?.firstName?.[0] || ticketDetails.assignee?.lastName?.[0] || 'U'}
                                </span>
                                <div className="assignee-info">
                                    <div className="assignee-name">
                                        {ticketDetails.assignee?.firstName && ticketDetails.assignee?.lastName
                                            ? `${ticketDetails.assignee.firstName} ${ticketDetails.assignee.lastName}`
                                            : ticketDetails.assignee?.name || 'Unassigned'}
                                    </div>
                                    <div className="assignee-email">{ticketDetails.assignee?.email || ''}</div>
                                </div>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="field-row">
                            <label className="field-label">Due Date</label>
                            <input
                                type="datetime-local"
                                className={`field-input ${!isEditMode ? 'readonly' : ''}`}
                                value={formatDate(getValue('dueDate'))}
                                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                                readOnly={!isEditMode}
                            />
                        </div>

                        {/* Response Due Date */}
                        <div className="field-row">
                            <label className="field-label">Response Due Date</label>
                            <input
                                type="datetime-local"
                                className={`field-input ${!isEditMode ? 'readonly' : ''}`}
                                value={formatDate(getValue('responseDueDate'))}
                                onChange={(e) => handleFieldChange('responseDueDate', e.target.value)}
                                readOnly={!isEditMode}
                            />
                        </div>
                    </div>
                </div>

                {/* Ticket Information Section */}
                <div className="property-section-clean">
                    <h4 className="section-title">Ticket Information</h4>
                    <div className="section-fields">
                        {/* Requestor */}
                        <div className="field-row">
                            <label className="field-label">Requestor</label>
                            <input
                                type="text"
                                className={`field-input ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('requestor', '-None-')}
                                onChange={(e) => handleFieldChange('requestor', e.target.value)}
                                readOnly={!isEditMode}
                            />
                        </div>

                        {/* Portal * (Mandatory) */}
                        <div className="field-row">
                            <label className="field-label mandatory">Portal</label>
                            <select
                                className={`field-select ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('portal')}
                                onChange={(e) => handleFieldChange('portal', e.target.value)}
                                disabled={!isEditMode}
                            >
                                <option value="">-None-</option>
                                {getFieldOptions('Portal').map((option: any) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Ministry/State */}
                        <div className="field-row">
                            <label className="field-label">Ministry/State</label>
                            <select
                                className={`field-select ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('ministryState')}
                                onChange={(e) => handleFieldChange('ministryState', e.target.value)}
                                disabled={!isEditMode}
                            >
                                <option value="">-None-</option>
                                {getFieldOptions('Ministry/State').map((option: any) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Department Name */}
                        <div className="field-row">
                            <label className="field-label">Department Name</label>
                            <input
                                type="text"
                                className={`field-input ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('departmentName', '-')}
                                onChange={(e) => handleFieldChange('departmentName', e.target.value)}
                                readOnly={!isEditMode}
                            />
                        </div>

                        {/* Organization */}
                        <div className="field-row">
                            <label className="field-label">Organization</label>
                            <select
                                className={`field-select ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('organization')}
                                onChange={(e) => handleFieldChange('organization', e.target.value)}
                                disabled={!isEditMode}
                            >
                                <option value="">-None-</option>
                                {getFieldOptions('Organization').map((option: any) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Classifications * (Mandatory) */}
                        <div className="field-row">
                            <label className="field-label mandatory">Classifications</label>
                            <select
                                className={`field-select ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('classifications')}
                                onChange={(e) => handleFieldChange('classifications', e.target.value)}
                                disabled={!isEditMode}
                            >
                                <option value="">-None-</option>
                                {getFieldOptions('classification').map((option: any) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Jira ID */}
                        <div className="field-row">
                            <label className="field-label">Jira ID</label>
                            <input
                                type="text"
                                className={`field-input ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('jiraId', '-')}
                                onChange={(e) => handleFieldChange('jiraId', e.target.value)}
                                readOnly={!isEditMode}
                            />
                        </div>

                        {/* Categories */}
                        <div className="field-row">
                            <label className="field-label">Categories</label>
                            <select
                                className={`field-select ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('categories')}
                                onChange={(e) => handleFieldChange('categories', e.target.value)}
                                disabled={!isEditMode}
                            >
                                <option value="">-None-</option>
                                {getFieldOptions('Categories').map((option: any) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sub-Categories */}
                        <div className="field-row">
                            <label className="field-label">Sub-Categories</label>
                            <select
                                className={`field-select ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('subCategories')}
                                onChange={(e) => handleFieldChange('subCategories', e.target.value)}
                                disabled={!isEditMode}
                            >
                                <option value="">-None-</option>
                                {getFieldOptions('Sub-Categories').map((option: any) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="field-row">
                            <label className="field-label">Priority</label>
                            <select
                                className={`field-select ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('priority', 'P3')}
                                onChange={(e) => handleFieldChange('priority', e.target.value)}
                                disabled={!isEditMode}
                            >
                                <option value="P1">P1</option>
                                <option value="P2">P2</option>
                                <option value="P3">P3</option>
                                <option value="P4">P4</option>
                            </select>
                        </div>

                        {/* Severity */}
                        <div className="field-row">
                            <label className="field-label">Severity</label>
                            <select
                                className={`field-select ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('severity', 'Sev 3')}
                                onChange={(e) => handleFieldChange('severity', e.target.value)}
                                disabled={!isEditMode}
                            >
                                <option value="Sev 1">Sev 1</option>
                                <option value="Sev 2">Sev 2</option>
                                <option value="Sev 3">Sev 3</option>
                                <option value="Sev 4">Sev 4</option>
                            </select>
                        </div>

                        {/* Working team */}
                        <div className="field-row">
                            <label className="field-label">Working team</label>
                            <input
                                type="text"
                                className={`field-input ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('workingTeam', '-None-')}
                                onChange={(e) => handleFieldChange('workingTeam', e.target.value)}
                                readOnly={!isEditMode}
                            />
                        </div>

                        {/* Description */}
                        <div className="field-row">
                            <label className="field-label">Description</label>
                            <textarea
                                className={`field-textarea ${!isEditMode ? 'readonly' : ''}`}
                                rows={4}
                                value={getValue('description')}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                readOnly={!isEditMode}
                            />
                        </div>

                        {/* Closed Date */}
                        <div className="field-row">
                            <label className="field-label">Closed Date</label>
                            <input
                                type="datetime-local"
                                className="field-input readonly"
                                value={ticketDetails.closedTime ? formatDate(ticketDetails.closedTime) : ''}
                                readOnly
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Information Section */}
                <div className="property-section-clean">
                    <h4 className="section-title">Additional Information</h4>
                    <div className="section-fields">
                        {/* Language */}
                        <div className="field-row">
                            <label className="field-label">Language</label>
                            <select
                                className={`field-select ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('language', 'English')}
                                onChange={(e) => handleFieldChange('language', e.target.value)}
                                disabled={!isEditMode}
                            >
                                <option value="English">English</option>
                                <option value="Hindi">Hindi</option>
                            </select>
                        </div>

                        {/* Channel */}
                        <div className="field-row">
                            <label className="field-label">Channel</label>
                            <select
                                className={`field-select ${!isEditMode ? 'readonly' : ''}`}
                                value={getValue('channel', 'Email')}
                                onChange={(e) => handleFieldChange('channel', e.target.value)}
                                disabled={!isEditMode}
                            >
                                <option value="Email">Email</option>
                                <option value="Phone">Phone</option>
                                <option value="Web">Web</option>
                                <option value="Chat">Chat</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer with Save/Cancel buttons */}
            <div className="properties-footer-clean">
                <button
                    className={`btn-save-large ${!hasChanges || isSaving ? 'disabled' : ''}`}
                    onClick={handleSaveClick}
                    disabled={!hasChanges || isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    className="btn-cancel"
                    onClick={handleCancelClick}
                    disabled={isSaving}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default TicketProperties;
