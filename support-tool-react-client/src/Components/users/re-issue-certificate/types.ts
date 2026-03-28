// Shared type definitions for Re-issue Certificate components

export interface IssuedCertificate {
  identifier: string;
  lastIssuedOn: string;
  name: string;
  token: string;
}

export interface ContentEnrollment {
  dateTime: number;
  lastReadContentStatus: number;
  enrolledDate: number;
  contentId: string;
  description: string;
  courseLogoUrl: string;
  batchId: string;
  content: any;
  contentStatus: any;
  lastContentAccessTime: number;
  certstatus: any;
  lastReadContentId: string;
  courseId: string;
  collectionId: string;
  addedBy: string;
  batch: any;
  active: boolean;
  userId: string;
  completionPercentage: number;
  issuedCertificates: IssuedCertificate[];
  courseName: string;
  certificates: any[];
  completedOn: number;
  leafNodesCount: number;
  progress: number;
  status: number;
}

export interface EventEnrollment {
  identifier?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: number;
  enrollmentEndDate?: string;
  venue?: string;
  onlineProvider?: string;
  sessionLink?: string;
  enrollmentStatus?: string;
  dateTime?: number;
  contentId?: string;
  batchId?: string;
  userId?: string;
  completionPercentage?: number;
  issuedCertificates?: IssuedCertificate[];
  certificates?: any[];
  completedOn?: number;
  progress?: number;
  event?: {
    identifier: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    eventType: string;
    status: string;
    appIcon?: string;
    startDateTime?: string;
    endDateTime?: string;
    registrationLink?: string;
    batches?: Array<{
      batchId: string;
      startDate: string;
      endDate: string;
      enrollmentEndDate: string;
      status: number;
    }>;
  };
  batchDetails?: Array<{
    batchId: string;
    name: string;
    startDate: number;
    endDate: number;
    status: number;
    enrollmentEndDate: number;
    certTemplates?: any;
  }>;
}

// Tab Panel Props
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Component Props Interfaces
export interface StatusFilterPillsProps {
  selectedStatuses: number[];
  onStatusFilterChange: (status: number) => void;
}

export interface SearchBarProps {
  searchQuery: string;
  placeholder: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ContentTableProps {
  contentEnrollments: ContentEnrollment[];
  filteredContent: ContentEnrollment[];
  contentPage: number;
  contentRowsPerPage: number;
  error: string | null;
  formatDate: (timestamp: number) => string;
  getStatusLabel: (status: number) => string;
  handleOpenReissueDialog: (enrollment: ContentEnrollment) => void;
  handleOpenCertificateDialog: (certId: string) => void;
  handleContentPageChange: (event: unknown, newPage: number) => void;
  handleContentRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleOpenContentDetailsDialog: (enrollment: ContentEnrollment) => void;
  canWrite?: boolean;
}

export interface EventsTableProps {
  eventEnrollments: EventEnrollment[];
  filteredEvents: EventEnrollment[];
  eventPage: number;
  eventRowsPerPage: number;
  error: string | null;
  formatDate: (timestamp: number) => string;
  getStatusLabel: (status: number) => string;
  handleOpenReissueDialog: (event: EventEnrollment) => void;
  handleOpenCertificateDialog: (certId: string) => void;
  handleEventPageChange: (event: unknown, newPage: number) => void;
  handleEventRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  canWrite?: boolean;
}

export interface ReissueDialogProps {
  open: boolean;
  selectedEnrollment: ContentEnrollment | EventEnrollment | null;
  processingReissue: boolean;
  reissueSuccess: boolean;
  reissueError: string | null;
  formatDate: (timestamp: number) => string;
  onClose: () => void;
  onReissue: () => void;
}

export interface CertificateDialogProps {
  open: boolean;
  certificateData: string | null;
  loadingCertificate: boolean;
  certificateError: string | null;
  downloadMenuAnchorEl: HTMLElement | null;
  isDownloadMenuOpen: boolean;
  onClose: () => void;
  onDownloadButtonClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onCloseDownloadMenu: () => void;
  onDownloadAsSVG: () => void;
  onDownloadAsPNG: () => void;
  onDownloadAsPDF: () => void;
}