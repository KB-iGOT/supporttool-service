import { useState, useCallback } from 'react';
import { ContentRequest, ContentCreateResponse, ContentUploadResponse } from '../types';
import { contentsService } from '../../../../services/contents.service';
import { useLocation } from 'react-router-dom';

interface UseStepUpdateProps {
  updateContent: (data: ContentRequest, contentId: string, isEditMode: boolean, currentStep?: number) => Promise<boolean>;
  contentData: ContentRequest;
  createResponse: ContentCreateResponse | null;
  uploadResponse: ContentUploadResponse | null;
  isEditMode: boolean;
  originalContent: any;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const useStepUpdate = ({
  updateContent,
  contentData,
  createResponse,
  uploadResponse,
  isEditMode,
  originalContent,
  onSuccess,
  onError
}: UseStepUpdateProps) => {
  const [isRefetching, setIsRefetching] = useState(false);

  // Fetch latest content to get the most recent version key
  const fetchLatestVersionKey = async (contentId: string): Promise<string | null> => {
    setIsRefetching(true);
    try {
      const response = await contentsService.privateContentRead(contentId);
      
      if (response.status === 200 && response.result?.result?.content?.versionKey) {
        const latestVersionKey = response.result.result.content.versionKey;
        return latestVersionKey;
      } else {
        throw new Error('Could not fetch latest version key');
      }
    } catch (err: any) {
      console.error('Error fetching latest version key:', err);
      onError(`Failed to fetch latest content version: ${err.message}`);
      return null;
    } finally {
      setIsRefetching(false);
    }
  };

  // Update content after step 1 (metadata changes)
  const updateContentMetadata = useCallback(async (forceEditMode?: boolean) => {
    // Use either the explicit forceEditMode parameter or the hook's isEditMode
    const effectiveEditMode = forceEditMode !== undefined ? forceEditMode : isEditMode;
    
    if (!createResponse?.identifier) return true;
    
    // Get the latest version key before update
    const latestVersionKey = await fetchLatestVersionKey(createResponse.identifier);
    if (!latestVersionKey) return false;
    
    // In creation mode, we need to update all fields that have been changed
    if (!effectiveEditMode) {
      // Create a modified content data with the latest version key
      const updatedContentData = {
        ...contentData,
        versionKey: latestVersionKey
      };

      // Call update with all fields (different handling than edit mode)
      return await updateContent(
        updatedContentData,
        createResponse.identifier,
        false, // Creation mode
        0 // Step 0 for metadata
      );
    }
    
    // Original edit mode logic
    // In step 1, only collect fields that are editable and have changed
    const changedFields: Partial<ContentRequest> = {
      versionKey: latestVersionKey // Use the freshly fetched version key
    };
    
    // Check for changes in editable fields
    if (contentData.endDate !== originalContent.endDate)
      changedFields.endDate = contentData.endDate;
      
    if (contentData.endTime !== originalContent.endTime)
      changedFields.endTime = contentData.endTime;
      
    if (contentData.registrationEndDate !== originalContent.registrationEndDate)
      changedFields.registrationEndDate = contentData.registrationEndDate;

    // Only proceed with update if there are changes
    if (Object.keys(changedFields).length <= 1) { // Only versionKey is present
      onSuccess('No changes detected, proceeding to next step');
      return true;
    }

    // Create a modified content data with the latest version key
    const updatedContentData = {
      ...contentData,
      versionKey: latestVersionKey
    };

    // Call update with specific step parameter to handle partial update
    return await updateContent(
      updatedContentData,
      createResponse.identifier,
      effectiveEditMode,
      0 // Step 0 for metadata
    );
  }, [contentData, createResponse, isEditMode, originalContent, updateContent, onSuccess, fetchLatestVersionKey]);

  // Update content after step 2 (file upload)
  const updateContentFile = useCallback(async () => {
    if (!isEditMode || !createResponse?.identifier || !uploadResponse) return true;
    
    // Get the latest version key before update
    const latestVersionKey = await fetchLatestVersionKey(createResponse.identifier);
    if (!latestVersionKey) return false;
    
    // Create a modified content data with the latest version key
    const updatedContentData = {
      ...contentData,
      versionKey: latestVersionKey
    };
    
    // For file uploads in edit mode, we need to update the artifact URL
    return await updateContent(
      updatedContentData,
      createResponse.identifier,
      isEditMode,
      1 // Step 1 for file upload
    );
  }, [contentData, createResponse, uploadResponse, isEditMode, updateContent, fetchLatestVersionKey]);

  // Final update with all changes (step 3)
  const updateContentFinal = useCallback(async () => {
    if (!createResponse?.identifier) {
      onError('Missing content identifier for update');
      return false;
    }
    
    // Get the latest version key before update
    const latestVersionKey = await fetchLatestVersionKey(createResponse.identifier);
    if (!latestVersionKey) return false;
    
    // Create a modified content data with the latest version key
    const updatedContentData = {
      ...contentData,
      versionKey: latestVersionKey
    };
    
    return await updateContent(
      updatedContentData, 
      createResponse.identifier,
      isEditMode,
      2 // Step 2 for final update
    );
  }, [contentData, createResponse, isEditMode, updateContent, onError, fetchLatestVersionKey]);

  return {
    updateContentMetadata: (forceEditMode?: boolean) => updateContentMetadata(forceEditMode),
    updateContentFile,
    updateContentFinal,
    isRefetching
  };
};