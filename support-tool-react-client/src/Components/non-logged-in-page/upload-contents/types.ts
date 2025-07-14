export interface ContentRequest {
  code: string;
  contentType: string;
  createdBy: string;
  description: string;
  framework: string;
  mimeType: string;
  name: string;
  redirectUrl: string;
  organisation: string[];
  channel: string;
  sequenceId: number;
  isExternal: boolean;
  primaryCategory: string;
  license: string;
  ownershipType: string[];
  purpose: string;
  visibility: string;
  location: { place: string };
  registrationLink: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  registrationEndDate: string;
  appIcon: string;
  source: string;
  position: string;
  versionKey?: string; // Add this to the interface
}

export interface ContentCreateResponse {
  identifier: string;
  versionKey: string;
  node_id: string;
}

export interface ContentUploadResponse {
  identifier: string;
  artifactUrl: string;
  versionKey: string;
  content_url: string;
  node_id: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface MimeTypeOption {
  value: string;
  label: string;
}