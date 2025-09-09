import { Request, Response } from "express";
import { RequestHandler } from "express";
import axios from "axios";
import logger from "../utils/logger";
import logAudit from "../helpers/auditLogger";

// Types
interface AuditObject {
  user_id: string;
  module: string;
  sub_module: string | null;
  action: string;
  entity_id: string;
  request_payload: any;
  modified_payload: any;
  response_payload: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: string | null;
  message: string | null;
  jira_link: string | null;
}

interface ApiResponse {
  status: number;
  responseCode: string;
  responseMessage: string;
  result?: any;
  error?: any;
}

// Utility functions
const createAuditObject = (
  user_id: string,
  module: string,
  sub_module: string,
  action: string,
  entity_id: string,
  request_payload: any,
  modified_payload: any,
  jira_link?: string,
): AuditObject => ({
  user_id,
  module,
  sub_module,
  action,
  entity_id,
  request_payload,
  modified_payload,
  response_payload: null,
  ip_address: null,
  user_agent: null,
  status: null,
  message: null,
  jira_link: jira_link || null,
});

const createApiHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": process.env.AUTHORIZATION || "",
  };
  
  if (token) {
    headers["x-authenticated-user-token"] = token.trim();
  }
  
  return headers;
};

const validateRequiredFields = (fields: Record<string, any>, requiredFields: string[]): string | null => {
  for (const field of requiredFields) {
    if (!fields[field]) {
      return `${field} is required`;
    }
  }
  return null;
};

// USER SEARCH OPERATIONS
export const getUsers: RequestHandler = async (req: any, res: Response) => {
  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/private/user/v1/search`,
      headers: createApiHeaders(req.user.token),
      data: req.body,
    });

    res.status(200).send(response.data);
  } catch (error) {
    handleApiError(error, res, "Error fetching users");
  }
};

export const getUserByEmail: RequestHandler = async (req: any, res: Response) => {
  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/private/user/v1/search`,
      headers: createApiHeaders(req.user.token),
      data: req.body,
    });

    res.status(200).send(response.data);
  } catch (error) {
    handleApiError(error, res, "Error searching user by email");
  }
};

// USER MANAGEMENT OPERATIONS
export const updateUser: RequestHandler = async (req: any, res: Response) => {
  const {
    payload,
    changedFields,
    userId,
    jiraLink,
    module,
  } = req.body;
  const user_id = req.headers["x-user-id"];

  const auditObject = createAuditObject(
    user_id,
    module,
    "UPDATE_USER",
    "UPDATE",
    userId || '',
    payload,
    changedFields,
    jiraLink
  );

  if (!user_id) {
    const error: ApiResponse = {
      status: 400,
      responseCode: "CLIENT_ERROR",
      responseMessage: "User ID is required",
    };
    
    await logAudit({
      ...auditObject,
      status: "FAILURE",
      response_payload: JSON.stringify(error),
      message: error.responseMessage,
    });

    res.status(400).json(error);
    return;
  }

  try {
    const response = await axios({
      method: "PATCH",
      url: `${process.env.KONG_API_URL}/api/user/private/v1/update`,
      headers: createApiHeaders(),
      data: payload,
    });

    logger.info(`User ${userId} updated successfully`);
    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response.data),
      message: "User updated successfully",
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    await auditLogApiError(error, res, `Error updating user ${userId}`, auditObject);
    handleApiError(error, res, `Error updating user ${userId}`);
  }
};

export const updateSuperUser: RequestHandler = async (req: any, res: Response) => {
  const targetUserId = req.params.userId;

  if (!targetUserId) {
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "User ID is required",
    });
    return;
  }

  try {
    const response = await axios({
      method: "PATCH",
      url: `${process.env.KONG_API_URL}/api/super/user/private/v1/update`,
      headers: createApiHeaders(),
      data: req.body,
    });

    logger.info(`Super user ${targetUserId} updated successfully`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, `Error updating super user ${targetUserId}`);
  }
};

export const updateUserExt: RequestHandler = async (req: any, res: Response) => {
  const {
    payload,
    changedFields,
    userId,
    jiraLink,
    module,
  } = req.body;
  const user_id = req.headers["x-user-id"];

  const auditObject = createAuditObject(
    user_id,
    module,
    "UPDATE_USER_STATUS",
    "UPDATE",
    userId || '',
    payload,
    changedFields,
    jiraLink
  );

  try {
    const adminToken = await fetchAdminAccessToken();
    const response = await axios({
      method: "POST", // As per curl, this seems to be a POST
      url: `${process.env.KONG_API_URL}/api/user/v1/admin/extPatch`,
      headers: createApiHeaders(adminToken),
      data: payload,
    });

    logger.info(`User external details for ${userId} updated successfully`);
    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response.data),
      message: "User external details updated successfully",
    });
    res.status(200).json(response.data);
  } catch (error) {
    await auditLogApiError(error, res, `Error updating user external details for ${userId}`, auditObject);
    handleApiError(error, res, `Error updating user external details for ${userId}`);
  }
};

export const createUsers: RequestHandler = async (req: any, res: Response) => {
  const {
    payload,
    changedFields,
    userId,
    jiraLink,
    module,
  } = req.body;
  const user_id = req.headers["x-user-id"];
  
  // Support both direct request and audit-wrapped request formats
  const actualPayload = payload || req.body;
  const userEmail = actualPayload.personalDetails?.email || 
                   actualPayload.request?.email || 
                   actualPayload.email || 
                   'unknown email';
  
  const auditObject = createAuditObject(
    user_id,
    module || "USER_MANAGEMENT",
    "CREATE_USER",
    "CREATE",
    userId || userEmail,
    actualPayload,
    changedFields || {},
    jiraLink
  );

  logger.info(`Creating new user with email: ${userEmail}`);
  
  try {
    const adminToken = await fetchAdminAccessToken();
    
    if (process.env.NODE_ENV !== 'production') {
      const sanitizedPayload = sanitizeUserPayload(actualPayload);
      logger.debug(`User creation payload: ${JSON.stringify(sanitizedPayload)}`);
    }
    
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/user/v3/create`,
      headers: createApiHeaders(adminToken),
      data: actualPayload
    });

    logger.info(`User created successfully with email: ${userEmail}`);
    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response.data),
      message: "User created successfully",
    });
    
    res.status(200).send(response.data);
  } catch (error) {
    await auditLogApiError(error, res, `Error creating user ${userEmail}`, auditObject);
    handleApiError(error, res, `Error creating user ${userEmail}`);
  }
};

export const migrateUser: RequestHandler = async (req: any, res: Response) => {
  const {
    payload,
    changedFields,
    userId,
    jiraLink,
    module,
  } = req.body;
  const user_id = req.headers["x-user-id"];

  const auditObject = createAuditObject(
    user_id,
    module,
    "MIGRATE_USER",
    "UPDATE",
    userId,
    payload,
    changedFields,
    jiraLink
  );
  
  try {
    const response = await axios({
      method: "PATCH",
      url: `${process.env.KONG_API_URL}/api/user/private/v1/migrate`,
      headers: createApiHeaders(req.user.token),
      data: payload
    });
    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response.data),
      message: "User role updated successfully",
    });
    
    logger.info(`User migrated successfully with ID: ${userId}`);
    res.status(200).send(response.data);
  } catch (error) {
    await auditLogApiError(error, res, `Error updating roles for user ${userId}`, auditObject);
    handleApiError(error, res, `Error migrating user ${userId}`);
  }
};

// USER ROLES & ACCESS OPERATIONS
export const assignUserRoles: RequestHandler = async (req: any, res: Response): Promise<void> => {
  const { userId, organisationId, roles } = req.body.request || {};
  
  const validationError = validateRequiredFields(
    { userId, organisationId, roles },
    ['userId', 'organisationId', 'roles']
  );
  
  if (validationError || !Array.isArray(roles)) {
    logger.warn('Invalid role assignment request - missing required fields');
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "User ID, organisation ID and roles array are required"
    });
    return;
  }

  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/user/private/v1/assign/role`,
      headers: createApiHeaders(),
      data: req.body
    });

    logger.info(`Roles successfully assigned to user: ${userId}`);
    res.status(200).json({
      status: 200,
      responseCode: "OK",
      message: "Roles assigned successfully",
      result: response.data
    });
  } catch (error) {
    handleApiError(error, res, `Error assigning roles to user ${userId}`);
  }
};

export const updateUserRoles: RequestHandler = async (req: any, res: Response): Promise<void> => {
  const {
    payload,
    changedFields,
    userId,
    jiraLink,
    module,
  } = req.body;
  const user_id = req.headers["x-user-id"];
  
  if (Object.keys(payload).length === 0) {
    logger.warn('Invalid role assignment request - missing required fields');
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "User ID, organisation ID and roles array are required"
    });
    return;
  }

  const auditObject = createAuditObject(
    user_id,
    module,
    'UPDATE_USER_ROLES',
    "UPDATE",
    userId,
    payload,
    changedFields,
    jiraLink
  );

  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/user/private/v1/assign/role`,
      headers: createApiHeaders(),
      data: payload
    });

    logger.info(`Roles successfully updated for user: ${userId}`);
    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response.data),
      message: "User role updated successfully",
    });
    
    res.status(200).json({
      status: 200,
      responseCode: "OK",
      message: "Roles assigned successfully",
      result: response.data
    });
  } catch (error) {
    await auditLogApiError(error, res, `Error updating roles for user ${userId}`, auditObject);
    handleApiError(error, res, `Error updating roles for user ${userId}`);
  }
};

export const assignUserRolesv1: RequestHandler = async (req: any, res: Response): Promise<void> => {
  const { userId, organisationId, roles } = req.body.request || {};
  
  const validationError = validateRequiredFields(
    { userId, organisationId, roles },
    ['userId', 'organisationId', 'roles']
  );
  
  if (validationError || !Array.isArray(roles)) {
    logger.warn('Invalid role assignment request - missing required fields');
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "User ID, organisation ID and roles array are required"
    });
    return;
  }

  try {
    const adminToken = await fetchAdminAccessToken();
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/user/v1/role/assign`,
      headers: createApiHeaders(adminToken),
      data: req.body
    });

    logger.info(`Roles successfully assigned to user: ${userId}`);
    res.status(200).json({
      status: 200,
      responseCode: "OK",
      message: "Roles assigned successfully",
      result: response.data
    });
  } catch (error) {
    handleApiError(error, res, `Error assigning roles to user ${userId}`);
  }
};

export const blockUser: RequestHandler = async (req: any, res: Response) => {
  const {
    payload,
    changedFields,
    userId,
    jiraLink,
    module,
  } = req.body;
  const user_id = req.headers["x-user-id"];

  const auditObject = createAuditObject(
    user_id,
    module,
    "BLOCK_USER",
    "UPDATE",
    userId,
    payload,
    changedFields,
    jiraLink
  );
  
  try {
    const adminToken = await fetchAdminAccessToken();
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/user/v1/block`,
      headers: createApiHeaders(adminToken),
      data: payload
    });
    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response.data),
      message: "User updated successfully",
    });
    logger.info(`User blocked successfully with ID: ${userId}`);
    res.status(200).send(response.data);
  } catch (error) {
    await auditLogApiError(error, res, `Error updating user ${userId}`, auditObject);
    handleApiError(error, res, `Error blocking user ${userId}`);
  }
};

export const unblockUser: RequestHandler = async (req: any, res: Response) => {
  const {
    payload,
    changedFields,
    userId,
    jiraLink,
    module,
  } = req.body;
  const user_id = req.headers["x-user-id"];

  const auditObject = createAuditObject(
    user_id,
    module,
    "UNBLOCK_USER",
    "UPDATE",
    userId,
    payload,
    changedFields,
    jiraLink
  );
  logger.info(`Unblocking user with ID: ${userId}`);
  
  try {
    const adminToken = await fetchAdminAccessToken();
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/user/v1/unblock`,
      headers: createApiHeaders(adminToken),
      data: payload
    });

    logger.info(`User unblocked successfully with ID: ${userId}`);

    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response.data),
      message: "User updated successfully",
    });
    res.status(200).send(response.data);
  } catch (error) {
    await auditLogApiError(error, res, `Error updating user ${userId}`, auditObject);
    handleApiError(error, res, `Error unblocking user ${userId}`);
  }
};

// USER DATA & CERTIFICATES
export const getUserEnrollList: RequestHandler = async (req: any, res: Response) => {
  const userId = req.params.userId;
  
  if (!userId) {
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "User ID is required"
    });
    return;
  }

  try {
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/course/private/v3/user/enrollment/list/${userId}`,
      headers: createApiHeaders()
    });

    logger.info(`Successfully retrieved enrollment data for user: ${userId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, `Error fetching enrollment list for user ${userId}`);
  }
};

export const getUserEventEnrollList: RequestHandler = async (req: any, res: Response) => {
  const userId = req.params.userId;
  
  if (!userId) {
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "User ID is required"
    });
    return;
  }

  try {
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/user/private/v1/events/list/${userId}`,
      headers: createApiHeaders()
    });

    logger.info(`Successfully retrieved event enrollment data for user: ${userId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, `Error fetching event enrollment list for user ${userId}`);
  }
};

export const getCertificate: RequestHandler = async (req: any, res: Response): Promise<void> => {
  const certId = req.params.certId;
  
  if (!certId) {
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "Certificate ID is required"
    });
    return;
  }

  try {
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/certreg/v2/certs/download/${certId}`,
      headers: createApiHeaders(req.user.token)
    });

    logger.info(`Successfully retrieved certificate data for ID: ${certId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, `Error fetching certificate with ID ${certId}`);
  }
};

export const reissueCertificate: RequestHandler = async (req: any, res: Response): Promise<void> => {

  const {
    payload,
    changedFields,
    userId,
    jiraLink,
    module,
  } = req.body;
  const user_id = req.headers["x-user-id"];
  const { courseId, batchId, userIds, type, eventId } = payload.request|| {};
  const requestBody = { ...payload };
  if (requestBody.request?.type) {
    delete requestBody.request.type;
  }
  const auditObject = createAuditObject(
    user_id,
    module,
    type === 'course' ? 'REISSUE_COURSE_CERTIFICATE' : 'REISSUE_EVENT_CERTIFICATE',
    "POST",
    userId,
    requestBody,
    changedFields,
    jiraLink
  );
  if (!( !eventId || !courseId )|| !batchId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "Course ID, batch ID and at least one user ID are required"
    });
    return;
  }

  try {
    let url = type === 'course' ? 'api/course/batch/cert/v1/issue?reIssue=true' : 'api/course/event/batch/cert/v1/issue?reIssue=true';
    console.log("url",`${process.env.KONG_API_URL}${url}`);
    console.log("requestBody",requestBody);
    const adminToken = await fetchAdminAccessToken();
    console.log("admin token",adminToken);
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}${url}`,
      headers: createApiHeaders(adminToken),
      data: requestBody
    });
    logger.info(`Certificate reissue request successfully submitted for course: ${courseId}, batch: ${batchId}`);
    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response.data),
      message: "User updated successfully",
    });
    res.status(200).json({
      status: 200,
      responseCode: "OK",
      message: "Certificate reissue request submitted successfully",
      result: response.data
    });
  } catch (error) {
    await auditLogApiError(error, res, `Error updating user ${userId}`, auditObject);
    handleApiError(error, res, `Error reissuing certificate for course ${courseId}, batch ${batchId}`);
  }
};

export const resetUserPassword: RequestHandler = async (req: any, res: Response) => {
  const {
    payload,
    changedFields,
    userId,
    jiraLink,
    module,
  } = req.body;
  const user_id = req.headers["x-user-id"];
  
  logger.info(`Resetting password for user with ID: ${userId}`);
  
  const auditObject = createAuditObject(
    user_id,
    module,
    "RESET_PASSWORD",
    "UPDATE",
    userId,
    payload,
    changedFields,
    jiraLink
  );

  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/private/user/v1/password/reset`,
      headers: createApiHeaders(req.user.token),
      data: payload
    });

    logger.info(`Password reset successful for user: ${userId}`);
    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response.data),
      message: "Password reset successful for user",
    });
    
    res.status(200).send(response.data);
  } catch (error) {
    await auditLogApiError(error, res, `Error resetting password for user ${userId}`, auditObject);
    handleApiError(error, res, `Error resetting password for user ${userId}`);
  }
};

// AUTHENTICATION & TOKEN MANAGEMENT
export const fetchAdminAccessToken = async (): Promise<string> => {
  logger.info(`Fetching admin access token for system admin`);
  
  try {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      throw new Error('Admin credentials not configured in environment variables');
    }
    
    const params = new URLSearchParams();
    params.append('client_id', 'admin-cli');
    params.append('grant_type', 'password');
    params.append('username', process.env.ADMIN_USERNAME);
    params.append('password', process.env.ADMIN_PASSWORD);
    
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/auth/realms/sunbird/protocol/openid-connect/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: params
    });

    logger.info(`Admin access token retrieved successfully`);
    return response.data.access_token;
  } catch (error) {
    logger.error(`❌ Error fetching admin access token`);
    logErrorDetails(error);
    throw error;
  }
};

export const getAdminAccessToken: RequestHandler = async (req: any, res: Response) => {
  try {
    const accessToken = await fetchAdminAccessToken();
    res.status(200).send({ access_token: accessToken });
  } catch (error) {
    handleApiError(error, res, "Error fetching admin access token");
  }
};

// UTILITY FUNCTIONS
function sanitizeUserPayload(payload: any) {
  const sanitized = { ...payload };
  if (sanitized.personalDetails?.phone) {
    sanitized.personalDetails.phone = '******' + 
      sanitized.personalDetails.phone.substring(
        Math.max(0, sanitized.personalDetails.phone.length - 4)
      );
  }
  return sanitized;
}

function logErrorDetails(error: any) {
  if (error.response) {
    logger.error(`API Error status: ${error.response.status}`);
    
    if (process.env.NODE_ENV !== 'production') {
      logger.error(`API Error details: ${JSON.stringify(error.response.data)}`);
    }
  } else if (error.request) {
    logger.error("No response received from API");
  } else {
    logger.error(`Request setup error: ${error.message}`);
  }
}

function handleApiError(error: any, res: Response, logMessage: string) {
  logger.error(`❌ ${logMessage}`);
  logErrorDetails(error);

  if (error.response) {
    res.status(error.response.status).json({
      responseCode: "API_ERROR",
      responseMessage: logMessage,
      error: error.response.data,
    });
  } else if (error.request) {
    res.status(503).json({
      responseCode: "SERVICE_UNAVAILABLE",
      responseMessage: "No response received from API",
      error: "Service unavailable",
    });
  } else {
    res.status(500).json({
      responseCode: "SERVER_ERROR",
      responseMessage: "Internal server error",
      error: error.message,
    });
  }
}

async function auditLogApiError(error: any, res: Response, logMessage: string, auditObject: AuditObject) {
  let responsePayload = '';
  let status = "FAILURE";
  
  if (error.response) {
    responsePayload = JSON.stringify(error.response.data || {});
  } else if (error.request) {
    responsePayload = JSON.stringify({ message: "No response received from API" });
    status = "SERVICE_UNAVAILABLE";
  } else {
    responsePayload = JSON.stringify({ message: error.message });
    status = "SERVICE_UNAVAILABLE";
  }
  
  await logAudit({
    ...auditObject,
    status,
    response_payload: responsePayload,
    message: logMessage,
  });
}
