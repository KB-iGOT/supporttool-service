import { Request, Response } from "express";
import { RequestHandler } from "express";
import axios from "axios";
import logger from "../utils/logger";
import logAudit from "../helpers/auditLogger";
import getClientIp from "../helpers/getClientIp";
import { createApiHeaders, fetchAdminAccessToken } from "../helpers/apiHelpers";

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
  ip_address?: string | null,
): AuditObject => ({
  user_id,
  module,
  sub_module,
  action,
  entity_id,
  request_payload,
  modified_payload,
  response_payload: null,
  ip_address: ip_address || null,
  user_agent: null,
  status: null,
  message: null,
  jira_link: jira_link || null,
});

// createApiHeaders and fetchAdminAccessToken are imported from ../helpers/apiHelpers

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
    jiraLink,
    getClientIp(req)
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
    jiraLink,
    getClientIp(req)
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
    jiraLink,
    getClientIp(req)
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
    jiraLink,
    getClientIp(req)
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
    jiraLink,
    getClientIp(req)
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
    jiraLink,
    getClientIp(req)
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
    jiraLink,
    getClientIp(req)
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
let requestBody: any ={
    "request": {
        "retiredCoursesEnabled": true,
        "status": ["In-Progress", "Completed"]
    }
}
   
  try {
    // const response = await axios({
    //   method: "GET",
    //   url: `${process.env.KONG_API_URL}/api/course/private/v3/user/enrollment/list/${userId}`,
    //   headers: createApiHeaders()
    // });
 const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/course/private/v4/user/enrollment/list/${userId}`,
      headers: createApiHeaders(),
      data: requestBody
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
    jiraLink,
    getClientIp(req)
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
    jiraLink,
    getClientIp(req)
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
// fetchAdminAccessToken is imported from ../helpers/apiHelpers

export const getAdminAccessToken: RequestHandler = async (req: any, res: Response) => {
  try {
    const accessToken = await fetchAdminAccessToken();
    res.status(200).send({ access_token: accessToken });
  } catch (error) {
    handleApiError(error, res, "Error fetching admin access token");
  }
};

// GET CBP PLAN
export const getCBPlan: RequestHandler = async (req: any, res: Response) => {
  const { email, rootOrgId } = req.body;

  if (!email || !rootOrgId) {
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "email and rootOrgId are required",
    });
    return;
  }

  try {
    console.log('req.user.token', req.user);
    const requestUserToken = await fetchAdminAccessToken(req.body.email);
    console.log('requestUserToken', requestUserToken);
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/user/v1/cbplan`,
      headers: {
        ...createApiHeaders(requestUserToken),
        "x-authenticated-user-orgid": rootOrgId,
      },
      params: { email },
    });

    res.status(200).send(response.data);
  } catch (error) {
    handleApiError(error, res, `Error fetching CBP plan for ${email}`);
  }
};

// GET ASSIGNED CAP (Comprehensive Assessment Program)
export const getAssignedCAP: RequestHandler = async (req: any, res: Response) => {
  const { email, userId } = req.body;

  if (!email || !userId) {
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "email and userId are required",
    });
    return;
  }

  try {
    const requestUserToken = await fetchAdminAccessToken(email);
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/user/v2/assignedcourses`,
      headers: {
        ...createApiHeaders(requestUserToken),
        "wid": userId,
        "hostpath": process.env.HOST_PATH || "portal.igotkarmayogi.gov.in",
        "rootorg": "igot",
        "org": "dopt",
        "locale": "en",
      },
      data: { courseCategory: "Comprehensive Assessment Program" },
    });

    res.status(200).send(response.data);
  } catch (error) {
    handleApiError(error, res, `Error fetching assigned CAP for ${email}`);
  }
};

// GET CBP PLAN DETAILS BY ID
export const getCBPlanDetails: RequestHandler = async (req: any, res: Response) => {
  const { planId } = req.params;

  if (!planId) {
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "planId is required",
    });
    return;
  }

  try {
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/cbplan/v2/read/${planId}`,
      headers: {
        ...createApiHeaders(),
        "x-authenticated-user-token": "",
        "x-authenticated-user-orgid": "",
      },
    });

    res.status(200).send(response.data);
  } catch (error) {
    handleApiError(error, res, `Error fetching CBP plan details for ${planId}`);
  }
};

export const getEnrollmentDetails: RequestHandler = async (req: any, res: Response) => {
  const { userId } = req.params;
  const { courseIds } = req.body;

  if (!userId) {
    res.status(400).json({ responseCode: "CLIENT_ERROR", responseMessage: "userId is required" });
    return;
  }
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    res.status(400).json({ responseCode: "CLIENT_ERROR", responseMessage: "courseIds array is required" });
    return;
  }

  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}api/course/admin/v4/user/enrollment/details/${userId}`,
      headers: createApiHeaders(),
      data: { request: { retiredCoursesEnabled: true, courseId: courseIds } },
    });
    logger.info(`Successfully retrieved enrollment details for user: ${userId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, `Error fetching enrollment details for user ${userId}`);
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

export const fetchGroups: RequestHandler = async (req: any, res: Response) => {
  logger.info(`Fetching user groups`);
  try {
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/user/v1/groups`,
      headers: createApiHeaders(),
    });

    logger.info(`Successfully fetched user groups`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, "Error fetching user groups");
  }
};

export const fetchCadreData: RequestHandler = async (req: any, res: Response) => {
  logger.info(`Fetching cadre configuration data`);
  try {
    const adminToken = await fetchAdminAccessToken();
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/data/v2/system/settings/get/cadreConfig`,
      headers: createApiHeaders(adminToken),
    });

    logger.info(`Successfully fetched cadre configuration data`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, "Error fetching cadre configuration data");
  }
};

export const fetchMasterLanguages: RequestHandler = async (req: any, res: Response) => {
  logger.info(`Fetching master languages`);
  try {
    const adminToken = await fetchAdminAccessToken();
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/user/profileRegistry/getMasterLanguages`,
      headers: createApiHeaders(adminToken),
    });

    logger.info(`Successfully fetched master languages`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, "Error fetching master languages");
  }
};


// 🚀 **Deactivate Bulk Users in DB**
export const deactivateBulkUser: RequestHandler = async (req: any, res: any) => {
  try {
    const { payload, jiraLink, changedFields, module } = req.body;
    const userRequests = payload?.request;
    const user_id = req.headers["x-user-id"];

    if (!userRequests || !Array.isArray(userRequests) || userRequests.length === 0) {
      return res.status(400).json({ message: "Request payload must contain an array of user deactivation requests." });
    }

    const adminToken = await fetchAdminAccessToken();
    
    const promises = userRequests.map(async (userRequest: any) => {
      const { userId, requestedBy } = userRequest;
      const singlePayload = { request: { userId, requestedBy } };

      const auditObject = createAuditObject(
        user_id,
        module,
        "BLOCK_USER_BULK",
        "UPDATE",
        userId,
        singlePayload,
        changedFields,
        jiraLink,
        getClientIp(req)
      );

      try {
        await axios({
          method: "POST",
          url: `${process.env.KONG_API_URL}/api/user/v1/block`,
          headers: createApiHeaders(adminToken),
          data: singlePayload
        });
        await logAudit({ ...auditObject, status: "SUCCESS", message: `User ${userId} blocked successfully.` });
        return userId; // Return the userId on success
      } catch (error: any) {
        // Pass null for res to prevent sending a response inside the loop
        await auditLogApiError(error, null as any, `Error blocking user ${userId}`, auditObject);
        // Throw an object with details, which will be the 'reason' in the settled result
        throw { userId, reason: error.message };
      }
    });

    const settledResults = await Promise.allSettled(promises);

    const results = settledResults.reduce<{ success: string[]; failure: { userId: string; reason: string }[] }>((acc, result) => {
      if (result.status === 'fulfilled') {
        acc.success.push(result.value); // result.value is the userId
      } else {
        acc.failure.push(result.reason); // result.reason is the object we threw
      }
      return acc;
    }, { success: [], failure: [] });

    res.status(200).json({ status: 200, message: "Bulk deactivation process completed.", results });
  } catch (error: any) {
    console.error("❌ Error during bulk user deactivation:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// 🚀 **Migrate Bulk Users V2 - Enhanced for Large Datasets**
export const migrateBulkUserV2: RequestHandler = async (req: any, res: any) => {
  try {
    const { payload, jiraLink, changedFields, module } = req.body;
    const userRequests = payload?.request;
    const migrationOptions = payload?.migrationOptions || {};
    const chunkInfo = payload?.chunkInfo || {}; // Additional info for V2: chunkId, totalChunks, etc.
    const user_id = req.headers["x-user-id"];

    if (!userRequests || !Array.isArray(userRequests) || userRequests.length === 0) {
      return res.status(400).json({ 
        message: "Request payload must contain an array of user migration requests.",
        chunkInfo 
      });
    }

    // V2: Enhanced validation for large batches (max 500 per chunk to avoid 413 errors)
    if (userRequests.length > 500) {
      return res.status(400).json({ 
        message: "V2 bulk migration supports maximum 500 users per chunk. Please split your request.",
        currentChunkSize: userRequests.length,
        maxAllowed: 500,
        chunkInfo
      });
    }

    // Extract migration options with defaults
    const {
      forceMigration = true,
      softDeleteOldOrg = true,
      notifyMigration = false
    } = migrationOptions;

    // V2: Enhanced logging with chunk information
    const chunkLog = chunkInfo.chunkId ? `[Chunk ${chunkInfo.chunkId}/${chunkInfo.totalChunks}] ` : '';
    logger.info(`${chunkLog}Starting bulk migration V2 for ${userRequests.length} users`);

    // V2: Enhanced processing with better error handling and progress tracking
    const promises = userRequests.map(async (userRequest: any, index: number) => {
      const { userId, channel } = userRequest;
      const singlePayload = { 
        request: { 
          userId, 
          channel, 
          forceMigration, 
          softDeleteOldOrg, 
          notifyMigration 
        } 
      };

      const auditObject = createAuditObject(
        user_id,
        module,
        `MIGRATE_USER_BULK_V2${chunkInfo.chunkId ? `_CHUNK_${chunkInfo.chunkId}` : ''}`,
        "UPDATE",
        userId,
        singlePayload,
        changedFields,
        jiraLink,
        getClientIp(req)
      );

      try {
        // V2: Add small delay for large chunks to prevent overwhelming the API
        if (index > 0 && index % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay every 100 requests
        }

        const response = await axios({
          method: "PATCH",
          url: `${process.env.KONG_API_URL}/api/user/private/v1/migrate`,
          headers: createApiHeaders(req.user.token),
          data: singlePayload,
          timeout: 30000 // 30 second timeout for V2
        });

        await logAudit({
          ...auditObject,
          status: "SUCCESS",
          response_payload: JSON.stringify(response.data),
          message: `${chunkLog}User migrated successfully in bulk operation V2`,
        });

        logger.info(`${chunkLog}User ${userId} migrated successfully in bulk operation V2`);
        return { 
          success: true, 
          userId, 
          result: { 
            ...response.data, 
            userId, 
            channel,
            chunkId: chunkInfo.chunkId,
            processedAt: new Date().toISOString()
          } 
        };
      } catch (error: any) {
        await auditLogApiError(error, res, `${chunkLog}Error migrating user ${userId} in bulk operation V2`, auditObject);
        logger.error(`${chunkLog}Failed to migrate user ${userId}: ${error.message}`);
        
        return { 
          success: false, 
          userId, 
          reason: { 
            userId, 
            channel, 
            chunkId: chunkInfo.chunkId,
            error: error.response?.data?.message || error.message || "Migration failed",
            errorCode: error.response?.status || 'UNKNOWN',
            processedAt: new Date().toISOString()
          } 
        };
      }
    });

    // V2: Enhanced result processing with detailed timing
    const startTime = Date.now();
    const results = await Promise.allSettled(promises);
    const processingTime = Date.now() - startTime;
    
    const processedResults = results.reduce((acc: any, result: any) => {
      if (result.status === "fulfilled" && result.value.success) {
        acc.success.push(result.value.result);
      } else {
        // Handle both rejected promises and fulfilled but failed migrations
        const failureReason = result.status === "fulfilled" ? result.value.reason : {
          userId: "unknown",
          channel: "unknown", 
          chunkId: chunkInfo.chunkId,
          error: result.reason?.message || "Unknown error occurred",
          errorCode: 'PROMISE_REJECTED',
          processedAt: new Date().toISOString()
        };
        acc.failure.push(failureReason);
      }
      return acc;
    }, { success: [], failure: [] });

    // V2: Enhanced summary with performance metrics
    const summary = {
      totalRequested: userRequests.length,
      successful: processedResults.success.length,
      failed: processedResults.failure.length,
      processingTimeMs: processingTime,
      averageTimePerUserMs: Math.round(processingTime / userRequests.length),
      chunkInfo: {
        chunkId: chunkInfo.chunkId || null,
        totalChunks: chunkInfo.totalChunks || null,
        chunkSize: userRequests.length,
        isLastChunk: chunkInfo.chunkId === chunkInfo.totalChunks
      },
      migrationOptions: {
        forceMigration,
        softDeleteOldOrg,
        notifyMigration
      },
      processedAt: new Date().toISOString(),
      version: "V2"
    };

    // V2: Enhanced logging with performance metrics
    logger.info(`${chunkLog}Bulk migration V2 completed: ${processedResults.success.length} successful, ${processedResults.failure.length} failed, ${processingTime}ms total`);

    res.status(200).json({ 
      status: 200, 
      message: `${chunkLog}Bulk migration V2 process completed. ${processedResults.success.length} successful, ${processedResults.failure.length} failed.`, 
      results: processedResults,
      summary,
      version: "V2"
    });
  } catch (error: any) {
    const chunkLog = req.body?.payload?.chunkInfo?.chunkId ? 
      `[Chunk ${req.body.payload.chunkInfo.chunkId}/${req.body.payload.chunkInfo.totalChunks}] ` : '';
    console.error(`❌ ${chunkLog}Error during bulk user migration V2:`, error);
    logger.error(`${chunkLog}Bulk migration V2 failed: ${error.message}`);
    
    res.status(500).json({ 
      message: `${chunkLog}Internal server error during bulk migration V2`, 
      error: error.message,
      chunkInfo: req.body?.payload?.chunkInfo || null,
      version: "V2"
    });
  }
};

// 🚀 **Migrate Bulk Users**
export const migrateBulkUser: RequestHandler = async (req: any, res: any) => {
  try {
    const { payload, jiraLink, changedFields, module } = req.body;
    const userRequests = payload?.request;
    const migrationOptions = payload?.migrationOptions || {};
    const user_id = req.headers["x-user-id"];

    if (!userRequests || !Array.isArray(userRequests) || userRequests.length === 0) {
      return res.status(400).json({ message: "Request payload must contain an array of user migration requests." });
    }

    // Extract migration options with defaults
    const {
      forceMigration = true,
      softDeleteOldOrg = true,
      notifyMigration = false
    } = migrationOptions;

    const promises = userRequests.map(async (userRequest: any) => {
      const { userId, channel } = userRequest;
      const singlePayload = { 
        request: { 
          userId, 
          channel, 
          forceMigration, 
          softDeleteOldOrg, 
          notifyMigration 
        } 
      };

      const auditObject = createAuditObject(
        user_id,
        module,
        "MIGRATE_USER_BULK",
        "UPDATE",
        userId,
        singlePayload,
        changedFields,
        jiraLink,
        getClientIp(req)
      );

      try {
        const response = await axios({
          method: "PATCH",
          url: `${process.env.KONG_API_URL}/api/user/private/v1/migrate`,
          headers: createApiHeaders(req.user.token),
          data: singlePayload
        });

        await logAudit({
          ...auditObject,
          status: "SUCCESS",
          response_payload: JSON.stringify(response.data),
          message: "User migrated successfully in bulk operation",
        });

        logger.info(`User ${userId} migrated successfully in bulk operation`);
        return { success: true, userId, result: { ...response.data, userId, channel } };
      } catch (error: any) {
        await auditLogApiError(error, res, `Error migrating user ${userId} in bulk operation`, auditObject);
        logger.error(`Failed to migrate user ${userId}: ${error.message}`);
        
        return { 
          success: false, 
          userId, 
          reason: { 
            userId, 
            channel, 
            error: error.response?.data?.message || error.message || "Migration failed" 
          } 
        };
      }
    });

    const results = await Promise.allSettled(promises);
    const processedResults = results.reduce((acc: any, result: any) => {
      if (result.status === "fulfilled" && result.value.success) {
        acc.success.push(result.value.result);
      } else {
        // Handle both rejected promises and fulfilled but failed migrations
        const failureReason = result.status === "fulfilled" ? result.value.reason : {
          userId: "unknown",
          channel: "unknown", 
          error: result.reason?.message || "Unknown error occurred"
        };
        acc.failure.push(failureReason);
      }
      return acc;
    }, { success: [], failure: [] });

    // Add summary information
    const summary = {
      totalRequested: userRequests.length,
      successful: processedResults.success.length,
      failed: processedResults.failure.length,
      migrationOptions: {
        forceMigration,
        softDeleteOldOrg,
        notifyMigration
      },
      processedAt: new Date().toISOString()
    };

    res.status(200).json({ 
      status: 200, 
      message: `Bulk migration process completed. ${processedResults.success.length} successful, ${processedResults.failure.length} failed.`, 
      results: processedResults,
      summary
    });
  } catch (error: any) {
    console.error("❌ Error during bulk user migration:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};