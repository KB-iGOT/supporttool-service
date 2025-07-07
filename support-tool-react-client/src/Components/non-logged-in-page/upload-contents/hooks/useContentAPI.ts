import { useState } from 'react';
import { contentsService } from '../../../../services/contents.service';
import { ContentRequest, ContentCreateResponse, ContentUploadResponse } from '../types';
import { transformArtifactUrl } from '../utils/contentHelpers';

interface UseContentAPIProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const useContentAPI = ({ onSuccess, onError }: UseContentAPIProps = {}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [createResponse, setCreateResponse] = useState<ContentCreateResponse | null>(null);
  const [uploadResponse, setUploadResponse] = useState<ContentUploadResponse | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [originalContent, setOriginalContent] = useState<any>(null);

  // Fetch content details by ID
  const fetchContentDetails = async (contentId: string) => {
    if (!contentId) return;
    
    setIsLoadingContent(true);
    
    try {
      const response = await contentsService.privateContentRead(contentId);
      
      if (response.status === 200 && response.result?.result?.content) {
        const contentDetails = response.result.result.content;
        
        // Parse location if it's a string
        let locationObj = { place: '' };
        if (contentDetails.location) {
          try {
            if (typeof contentDetails.location === 'string') {
              locationObj = JSON.parse(contentDetails.location);
            } else {
              locationObj = contentDetails.location;
            }
          } catch (e) {
            console.error('Error parsing location:', e);
            locationObj = { place: contentDetails.location || '' };
          }
        }
        
        // Store the original content for comparison during updates
        setOriginalContent(contentDetails);
        
        // Set the create response to enable file upload
        setCreateResponse({
          identifier: contentDetails.identifier,
          versionKey: contentDetails.versionKey || '',
          node_id: contentDetails.identifier
        });
        
        // If there's already an artifactUrl, set it as uploaded
        if (contentDetails.artifactUrl) {
          setUploadResponse({
            identifier: contentDetails.identifier,
            artifactUrl: transformArtifactUrl(contentDetails.artifactUrl),
            versionKey: contentDetails.versionKey || '',
            content_url: contentDetails.artifactUrl,
            node_id: contentDetails.identifier
          });
        }
        
        onSuccess?.(`Content "${contentDetails.name}" loaded successfully for editing`);
        
        return {
          contentDetails,
          locationObj
        };
      } else {
        throw new Error('Invalid response format or content not found');
      }
    } catch (err: any) {
      console.error('Error fetching content details:', err);
      onError?.(`Failed to load content: ${err.response?.data?.params?.errmsg || err.message}`);
      return null;
    } finally {
      setIsLoadingContent(false);
    }
  };

  // Create content
  const createContent = async (contentData: ContentRequest) => {
    setLoading(true);

    try {
      let requestData = {
        request: {
          content: {
            name: contentData.name,
            description: contentData.description,
            location: contentData.location,
            createdBy: contentData.createdBy,
            registrationLink: contentData.registrationLink,
            startDate: contentData.startDate,
            endDate: contentData.endDate,
            startTime: contentData.startTime,
            endTime: contentData.endTime,
            code: contentData.code,
            registrationEndDate: contentData.registrationEndDate,
            appIcon: contentData.appIcon,
            primaryCategory: contentData.primaryCategory,
            channel: contentData.channel,
            mimeType: contentData.mimeType,
            source: contentData.source,
            position: contentData.position,
            contentType: 'Resource',
            framework: 'igot',
            license: 'CC BY 4.0',
            ownershipType: ['createdFor'],
            visibility: 'Default'
          }
        }
      };
      const response = await contentsService.privateContentCreate(requestData);

      if (response.responseCode === 'OK' && response.result) {
        setCreateResponse(response.result);
        onSuccess?.('Content created successfully! Now you can upload a file.');
        return response.result;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error creating content:', err);
      onError?.(`Failed to create content: ${err.response?.data?.params?.errmsg || err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const uploadFile = async (file: File, contentId: string) => {
    if (!file || !contentId) {
      onError?.('Please select a file to upload and ensure content was created successfully');
      return null;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('data', file);

      const response = await contentsService.privateContentUpload(formData, contentId);

      if (response.status === 200 && response.result.result) {
        // Transform the artifactUrl before setting it in state
        const result = response.result.result;
        result.artifactUrl = transformArtifactUrl(result.artifactUrl);

        setUploadResponse(result);
        onSuccess?.('File uploaded successfully! You can now view content details.');
        return result;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      onError?.(`Failed to upload file: ${err.response?.data?.params?.errmsg || err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update content with step-specific changes
  const updateContent = async (
    contentData: ContentRequest, 
    contentId: string, 
    isEditMode: boolean,
    currentStep?: number
  ) => {
    if (!contentId) {
      onError?.('Missing required content identifier');
      return false;
    }

    setLoading(true);

    try {
      // Use the version key provided in contentData (which should be the latest)
      const latestVersionKey = contentData.versionKey || 
                              uploadResponse?.versionKey || 
                              createResponse?.versionKey;
      
      if (!latestVersionKey) {
        onError?.('Missing version key for content update');
        return false;
      }
      
      // Create an object to hold only the changed fields
      const changedFields: any = {
        identifier: contentId,
        versionKey: latestVersionKey,
      };
      
      if (isEditMode) {
        // Edit mode - restrict which fields can be updated
        if (currentStep === 0) {
          // In step 1 (metadata), only update editable date fields
          if (contentData.endDate !== originalContent.endDate)
            changedFields.endDate = contentData.endDate;
            
          if (contentData.endTime !== originalContent.endTime)
            changedFields.endTime = contentData.endTime;
            
          if (contentData.registrationEndDate !== originalContent.registrationEndDate)
            changedFields.registrationEndDate = contentData.registrationEndDate;
        } 
        else if (currentStep === 1) {
          // In step 2 (file upload), only update artifactUrl
          if (uploadResponse?.artifactUrl) {
            changedFields.artifactUrl = uploadResponse.content_url;
            changedFields.mimeType = contentData.mimeType;
          }
        }
        else {
          // In final step or non-specified step, include all editable fields
          if (contentData.endDate !== originalContent.endDate)
            changedFields.endDate = contentData.endDate;
            
          if (contentData.endTime !== originalContent.endTime)
            changedFields.endTime = contentData.endTime;
            
          if (contentData.registrationEndDate !== originalContent.registrationEndDate)
            changedFields.registrationEndDate = contentData.registrationEndDate;
            
          // Include artifactUrl if it was updated
          if (uploadResponse?.artifactUrl) {
            changedFields.artifactUrl = uploadResponse.content_url;
            changedFields.mimeType = contentData.mimeType;
          }
        }
      } else {
        // Create mode - include all modified fields
        
        // For step 0 in creation mode, include all form fields
        const fieldsToInclude = [
          'name', 'description', 'location', 'createdBy', 'registrationLink',
          'startDate', 'endDate', 'startTime', 'endTime', 'code',
          'registrationEndDate', 'primaryCategory', 'mimeType', 
          'source', 'position', 'appIcon', 'channel'
        ];
        
        fieldsToInclude.forEach(key => {
          if (contentData[key as keyof ContentRequest] !== undefined) {
            changedFields[key] = contentData[key as keyof ContentRequest];
          }
        });
        
        // Always include artifactUrl if we have an upload response in create mode
        if (uploadResponse?.artifactUrl) {
          changedFields.artifactUrl = uploadResponse.content_url;
        }
      }

      // Skip update if no fields have changed
      if (Object.keys(changedFields).length <= 2) { // Only identifier and versionKey
        onSuccess?.('No changes detected, proceeding');
        return true;
      }

      console.log('Updating content with fields:', changedFields);

      // Prepare request data with changed fields
      const updateData = {
        request: {
          content: changedFields
        }
      };
      
      const response = await contentsService.privateContentUpdate(updateData, contentId);
      
      if (response.status === 200) {
        // Update the version key for future updates
        if (response.result?.result?.versionKey) {
          if (uploadResponse) {
            setUploadResponse({
              ...uploadResponse,
              versionKey: response.result.result.versionKey
            });
          }
          if (createResponse) {
            setCreateResponse({
              ...createResponse,
              versionKey: response.result.result.versionKey
            });
          }
        }
        
        const stepMessages = {
          0: isEditMode ? 'Content metadata updated successfully!' : 'Content details updated successfully!',
          1: 'File updated successfully!',
          2: 'Content updated successfully! Redirecting to content list...'
        };
        
        onSuccess?.(stepMessages[currentStep as keyof typeof stepMessages] || 'Content updated successfully!');
        return true;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error updating content:', err);
      onError?.(`Failed to update content: ${err.response?.data?.params?.errmsg || err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    isLoadingContent,
    createResponse,
    uploadResponse,
    fetchContentDetails,
    createContent,
    uploadFile,
    updateContent,
    setCreateResponse,
    setUploadResponse,
    originalContent
  };
};