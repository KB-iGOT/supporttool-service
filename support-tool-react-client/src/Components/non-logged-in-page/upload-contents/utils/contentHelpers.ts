import env from "../../../../Config/env";
import { ContentRequest } from "../types";

// Transform artifact URLs from storage to content-store URLs
export const transformArtifactUrl = (url: string): string => {
  if (!url) return '';
  return url.replace(
    `https://storage.googleapis.com/${env?.isProduction? 'igotprod':'igotuat'}/content`, 
    `${env?.nonLoggedInBaseUrl}${env?.nonLoggedInBucketName}/content`
  );
};

// Validate required fields for the content form
export const validateRequiredFields = (contentData: ContentRequest): boolean => {
  return Boolean(
    contentData.name && 
    contentData.location?.place && 
    contentData.startDate && 
    contentData.endDate && 
    contentData.startTime && 
    contentData.endTime &&
    contentData.registrationEndDate
  );
};

// Extract time from a time string for form fields
export const extractTime = (timeString: string): string => {
  const match = timeString.match(/(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  return "09:30";
};

// Get primary categories list
export const getPrimaryCategories = () => [
  'Landing Page Resource',
  'Learning Resource',
  'Course',
  'Learning Path',
  'Banner',
  'career',
  'tender',
  'notification'
];

// Get mime type options
export const getMimeTypes = () => [
  { value: 'image/png', label: 'PNG Image' },
  { value: 'image/jpeg', label: 'JPEG Image' },
  { value: 'image/svg+xml', label: 'SVG Image' },
  { value: 'application/pdf', label: 'PDF Document' },
  { value: 'video/mp4', label: 'MP4 Video' },
  { value: 'application/vnd.ekstep.html-archive', label: 'HTML Archive' }
];