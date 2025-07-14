export interface User {
  id: number;
  userId: string;
  userName: string;
  firstName: string;
  lastName: string;
  roles: string;
  createdAt: string;
  updatedAt: string;
  email?: string;
}

export interface ICreateUser {
  userId: string | undefined;
  userName: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  roles: any | undefined;
  email?: string;
}

export interface UserProfile {
  webPages: string | null;
  maskedPhone: string | null;
  tcStatus: string | null;
  loginId: string | null;
  rootOrgName: string;
  subject: string | null;
  channel: string;
  profileUserTypes: string[];
  language: string | null;
  updatedDate: string;
  password: string | null;
  managedBy: string | null;
  flagsValue: number;
  id: string;
  recoveryEmail: string;
  identifier: string;
  thumbnail: string | null;
  profileVisibility: string | null;
  updatedBy: string | null;
  accesscode: string | null;
  last_login: string | null;
  locationIds: string | null;
  registryId: string | null;
  nodebbid: string | null;
  rootOrgId: string;
  prevUsedEmail: string;
  firstName: string;
  profileLocation: any[];
  tncAcceptedOn: string | null;
  allTncAccepted: Record<string, any>;
  profileDetails: {
    profileGroupStatus: string;
    profileDesignationStatus: string;
    employmentDetails: {
      departmentName: string;
    };
    profileStatus: string;
    personalDetails: {
      firstname: string;
      primaryEmail: string;
      mobile: string;
    };
    mandatoryFieldsExists: boolean;
  };
  phone: string;
  dob: string | null;
  grade: string | null;
  currentLoginTime: string | null;
  userType: string | null;
  status: number;
  lastName: string | null;
  aadhaarno: string | null;
  gender: string | null;
  roles: string[];
  prevUsedPhone: string;
  stateValidated: boolean;
  isDeleted: boolean;
  organisations: {
    organisationId: string;
    updatedBy: string | null;
    orgName: string;
    addedByName: string | null;
    addedBy: string | null;
    associationType: number;
    roles: string[];
    approvedBy: string | null;
    updatedDate: string | null;
    userId: string;
    approvaldate: string | null;
    isDeleted: boolean;
    hashTagId: string;
    isRejected: string | null;
    id: string;
    position: string | null;
    isApproved: string | null;
    orgjoindate: string;
    orgLeftDate: string | null;
  }[];
  provider: string | null;
  countryCode: string | null;
  maskedEmail: string;
  regorgid: string | null;
  tempPassword: string | null;
  email: string;
  phoneVerified: boolean;
  profileSummary: string | null;
  tcUpdatedDate: string | null;
  recoveryPhone: string;
  avatar: string | null;
  userName: string;
  userId: string;
  userSubType: string | null;
  first_login: string | null;
  emailVerified: boolean;
  lastLoginTime: string | null;
  createdDate: string;
  framework: Record<string, any>;
  createdBy: string | null;
  profileUserType: Record<string, any>;
  location: string | null;
  tncAcceptedVersion: string | null;
}