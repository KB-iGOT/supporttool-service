import { useState, useEffect, useContext } from 'react';
import { ContentRequest, FormErrors } from '../types';
import { AppContext } from '../../../../Context/AppContext';
import { appContextType } from '../../../../types';

interface UseContentFormProps {
  primaryCategoryFromQuery: string | null;
  doId?: string;
}

export const useContentForm = ({ primaryCategoryFromQuery, doId }: UseContentFormProps) => {
  const { user } = useContext(AppContext) as appContextType;
  const isEditMode = Boolean(doId);

  // Initial content data state
  const [contentData, setContentData] = useState<ContentRequest>({
    code: primaryCategoryFromQuery || 'career',
    contentType: 'Resource',
    createdBy: user?.userId || '',
    description: '',
    framework: 'igot',
    mimeType: 'application/pdf',
    name: '',
    redirectUrl: '',
    organisation: [''],
    channel: 'igot',
    sequenceId: 0,
    isExternal: false,
    primaryCategory: primaryCategoryFromQuery || 'career',
    license: 'CC BY 4.0',
    ownershipType: ['createdFor'],
    purpose: '',
    visibility: 'Default',
    location: { place: '' },
    startDate: '',
    endDate: '',
    startTime: '09:30:00+05:30',
    endTime: '17:00:00+05:30',
    registrationEndDate: '',
    registrationLink: '',
    appIcon: 'https://karmayogibharat.gov.in/assets/images/logo.svg',
    source: 'Karmayogi Bharat',
    position: 'Open'
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Update user ID when user context changes
  useEffect(() => {
    if (user && user.userId) {
      setContentData(prev => ({
        ...prev,
        createdBy: user.userId
      }));
    }
  }, [user]);

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Validate name
    if (!contentData.name.trim()) {
      errors.name = 'Content name is required';
    }
    
    // Validate location
    if (!contentData.location.place.trim()) {
      errors.locationPlace = 'Location is required';
    }
    
    // Validate dates
    if (!contentData.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!contentData.endDate) {
      errors.endDate = 'End date is required';
    } else if (contentData.endDate < contentData.startDate) {
      errors.endDate = 'End date must be after start date';
    }
    
    if (!contentData.registrationEndDate) {
      errors.registrationEndDate = 'Registration end date is required';
    } else if (contentData.startDate && contentData.endDate) {
      if (contentData.registrationEndDate < contentData.startDate) {
        errors.registrationEndDate = 'Registration end date must be on or after start date';
      } else if (contentData.registrationEndDate > contentData.endDate) {
        errors.registrationEndDate = 'Registration end date must be on or before end date';
      }
    }
    
    // Validate times
    if (!contentData.startTime) {
      errors.startTime = 'Start time is required';
    }
    
    if (!contentData.endTime) {
      errors.endTime = 'End time is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContentData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle select input changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setContentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle time input changes
  const handleTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Format the time value to match the API format
    const formattedTime = `${value}:00+05:30`;
    setContentData(prev => ({
      ...prev,
      [name]: formattedTime
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle location input change
  const handleLocationChange = (place: string) => {
    setContentData(prev => ({
      ...prev,
      location: { place }
    }));
    
    // Clear error
    if (formErrors.locationPlace) {
      setFormErrors(prev => ({
        ...prev,
        locationPlace: ''
      }));
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setContentData({
      code: primaryCategoryFromQuery || 'career',
      contentType: 'Resource',
      createdBy: user?.userId || '',
      description: '',
      framework: 'igot',
      mimeType: 'application/pdf',
      name: '',
      redirectUrl: '',
      organisation: [''],
      channel: 'igot',
      sequenceId: 0,
      isExternal: false,
      primaryCategory: primaryCategoryFromQuery || 'career',
      license: 'CC BY 4.0',
      ownershipType: ['createdFor'],
      purpose: '',
      visibility: 'Default',
      location: { place: '' },
      startDate: '',
      endDate: '',
      startTime: '09:30:00+05:30',
      endTime: '17:00:00+05:30',
      registrationEndDate: '',
      registrationLink: '',
      appIcon: 'https://karmayogibharat.gov.in/assets/images/logo.svg',
      source: 'Karmayogi Bharat',
      position: 'Open'
    });
    setFormErrors({});
  };

  return {
    contentData,
    setContentData,
    formErrors,
    setFormErrors,
    validateForm,
    handleInputChange,
    handleSelectChange,
    handleTimeInput,
    handleLocationChange,
    resetForm,
    isEditMode
  };
};