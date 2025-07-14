import { Request, Response } from "express";
import { RequestHandler } from "express";
import axios from "axios";
import logger from "../utils/logger";

// USER SEARCH OPERATIONS
export const getUsers: RequestHandler = async (req: any, res: Response) => {
  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/private/user/v1/search`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
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
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: req.body,
    });

    res.status(200).send(response.data);
  } catch (error) {
    handleApiError(error, res, "Error searching user by email");
  }
};

// USER MANAGEMENT OPERATIONS
export const updateUser: RequestHandler = async (req: any, res: Response) => {
  const targetUserId = req.params.userId;

  if (!targetUserId) {
     res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "User ID is required",
    });
  }

  try {
    const response = await axios({
      method: "PATCH",
      url: `${process.env.KONG_API_URL}/api/user/private/v1/update`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: req.body,
    });

    logger.info(`User ${targetUserId} updated successfully`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, `Error updating user ${targetUserId}`);
  }
};

export const createUsers: RequestHandler = async (req: any, res: Response) => {
  const userEmail = req.body.personalDetails?.email || 'unknown email';
  logger.info(`Creating new user with email: ${userEmail}`);
  
  try {
    const adminToken = await fetchAdminAccessToken();
    console.log(`Admin token fetched successfully: ${adminToken}`);
    if (process.env.NODE_ENV !== 'production') {
      const sanitizedPayload = sanitizeUserPayload(req.body);
      logger.debug(`User creation payload: ${JSON.stringify(sanitizedPayload)}`);
    }
    
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/apis/protected/v8/user/profileDetails/createUser`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": adminToken
      },
      data: req.body
    });

    logger.info(`User created successfully with email: ${userEmail}`);
    res.status(200).send(response.data);
  } catch (error) {
    handleApiError(error, res, `Error creating user ${userEmail}`);
  }
};

export const migrateUser: RequestHandler = async (req: any, res: Response) => {
  const userId = req.body.request?.userId || 'unknown ID';
  logger.info(`Migrating user with ID: ${userId}`);
  
  try {
    const response = await axios({
      method: "PATCH",
      url: `${process.env.KONG_API_URL}/api/user/private/v1/migrate`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: req.body
    });

    logger.info(`User migrated successfully with ID: ${userId}`);
    res.status(200).send(response.data);
  } catch (error) {
    handleApiError(error, res, `Error migrating user ${userId}`);
  }
};

// USER ROLES & ACCESS OPERATIONS
export const assignUserRoles: RequestHandler = async (req: any, res: Response): Promise<void> => {
  const { userId, organisationId, roles } = req.body.request || {};
  
  if (!userId || !organisationId || !roles || !Array.isArray(roles)) {
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
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
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
  const userId = req.body.request?.userId || 'unknown ID';
  logger.info(`Blocking user with ID: ${userId}`);
  
  const adminToken = await fetchAdminAccessToken();
  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/user/v1/block`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": adminToken,
      },
      data: req.body
    });

    logger.info(`User blocked successfully with ID: ${userId}`);
    res.status(200).send(response.data);
  } catch (error) {
    handleApiError(error, res, `Error blocking user ${userId}`);
  }
};

export const unblockUser: RequestHandler = async (req: any, res: Response) => {
  const userId = req.body.request?.userId || 'unknown ID';
  logger.info(`Unblocking user with ID: ${userId}`);
  
  
  const adminToken = await fetchAdminAccessToken();
  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/user/v1/unblock`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": adminToken.trim(),
      },
      data: req.body
    });

    logger.info(`User unblocked successfully with ID: ${userId}`);
    res.status(200).send(response.data);
  } catch (error) {
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
  }

  try {
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/course/private/v3/user/enrollment/list/${userId}`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION
      }
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
  }

  try {
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/user/private/v1/events/list/${userId}`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION
      }
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
  }

  try {
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/certreg/v2/certs/download/${certId}`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim()
      }
    });

    logger.info(`Successfully retrieved certificate data for ID: ${certId}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, `Error fetching certificate with ID ${certId}`);
  }
};

export const reissueCertificate: RequestHandler = async (req: any, res: Response): Promise<void> => {
  const { courseId, batchId, userIds, type } = req.body.request || {};
  
  if (!courseId || !batchId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "Course ID, batch ID and at least one user ID are required"
    });
  }

  try {
    const requestBody = { ...req.body };
    if (requestBody.request?.type) {
      delete requestBody.request.type;
    }
  
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}api/${type === 'course' ? 'course' : 'event'}/batch/cert/v1/issue?reIssue=true`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim()
      },
      data: requestBody
    });

    logger.info(`Certificate reissue request successfully submitted for course: ${courseId}, batch: ${batchId}`);
    res.status(200).json({
      status: 200,
      responseCode: "OK",
      message: "Certificate reissue request submitted successfully",
      result: response.data
    });
  } catch (error) {
    handleApiError(error, res, `Error reissuing certificate for course ${courseId}, batch ${batchId}`);
  }
};

export const resetUserPassword: RequestHandler = async (req: any, res: Response) => {
  const userId = req.body.request?.userId || 'unknown ID';
  logger.info(`Resetting password for user with ID: ${userId}`);
  
  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/private/user/v1/password/reset`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: req.body
    });

    logger.info(`Password reset successful for user: ${userId}`);
    res.status(200).send(response.data);
  } catch (error) {
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