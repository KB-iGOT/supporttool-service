import { Request, Response } from "express";
import { RequestHandler } from "express";
import axios from "axios";
import logger from "../utils/logger";
import logAudit from "../helpers/auditLogger";
import getClientIp from "../helpers/getClientIp";

// Create API headers
const createApiHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "accept": "*/*",
    "Authorization": process.env.AUTHORIZATION || '',
    "x-authenticated-user-token": token ? token.trim() : "",
  };
  

  
  return headers;
};

// Handle API errors
function handleApiError(error: any, res: Response, logMessage: string) {
  logger.error(`❌ ${logMessage}`);
  
  if (error.response) {
    logger.error(`API Error status: ${error.response.status}`);
    if (process.env.NODE_ENV !== 'production') {
      logger.error(`API Error details: ${JSON.stringify(error.response.data)}`);
    }
    
    res.status(error.response.status).json({
      responseCode: "API_ERROR",
      responseMessage: logMessage,
      error: error.response.data,
    });
  } else if (error.request) {
    logger.error("No response received from API");
    res.status(503).json({
      responseCode: "SERVICE_UNAVAILABLE",
      responseMessage: "No response received from API",
      error: "Service unavailable",
    });
  } else {
    logger.error(`Request setup error: ${error.message}`);
    res.status(500).json({
      responseCode: "SERVER_ERROR",
      responseMessage: "Internal server error",
      error: error.message,
    });
  }
}

// Get topics list
export const getTopics: RequestHandler = async (req: any, res: Response) => {
  logger.info("Fetching topics list");
  
  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/community/v1/topic/search`,
      headers: createApiHeaders(req.user.token),
      data: req.body,
    });

    logger.info("Successfully retrieved topics list");
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, "Error fetching topics");
  }
};

// Create a new topic
export const createTopic: RequestHandler = async (req: any, res: Response) => {
  const { jiraLink, module, requestPayload } = req.body;
  const user_id = req.headers["x-user-id"];
  
  const { categoryName, description } = requestPayload || {};
  
  const auditObject = {
    user_id,
    module: module || 'TOPICS',
    sub_module: 'CREATE_TOPIC',
    action: 'CREATE',
    entity_id: categoryName,
    request_payload: requestPayload,
    modified_payload: null,
    status: 'PENDING',
    message: `Attempting to create topic: ${categoryName}`,
    jira_link: jiraLink,
    ip_address: getClientIp(req),
  };

  logger.info("Creating new topic");
  
  try {
    if (!categoryName || !categoryName.trim()) {
      const errorResponse = {
        responseCode: "BAD_REQUEST",
        responseMessage: "Category name is required",
      };
      
      await logAudit({
        ...auditObject,
        status: 'FAILURE',
        response_payload: errorResponse,
        message: 'Category name is required',
      });
      
      res.status(400).json(errorResponse);
      return;
    }

    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/community/v1/category/create`,
      headers: createApiHeaders(req.user.token),
      data: {
        categoryName: categoryName.trim(),
        description: description?.trim() || "",
      },
    });

    logger.info(`Successfully created topic: ${categoryName}`);
    
    await logAudit({
      ...auditObject,
      status: 'SUCCESS',
      response_payload: response.data,
      message: `Successfully created topic: ${categoryName}`,
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    const errorMessage = `Error creating topic: ${categoryName}`;
    logger.error(`❌ ${errorMessage}`);
    
    let errorResponse: any = { message: errorMessage, error: 'Internal Server Error' };
    let statusCode = 500;

    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status;
      errorResponse = {
        responseCode: "API_ERROR",
        responseMessage: errorMessage,
        error: error.response.data,
      };
      
      if (process.env.NODE_ENV !== 'production') {
        logger.error(`API Error details: ${JSON.stringify(error.response.data)}`);
      }
    } else if (error instanceof Error) {
      errorResponse = {
        responseCode: "SERVER_ERROR",
        responseMessage: "Internal server error",
        error: error.message,
      };
    }
    
    await logAudit({
      ...auditObject,
      status: 'FAILURE',
      response_payload: errorResponse,
      message: errorMessage,
    });
    
    res.status(statusCode).json(errorResponse);
  }
};

// Update an existing topic
export const updateTopic: RequestHandler = async (req: any, res: Response) => {
  const { jiraLink, module, requestPayload, modifiedPayload } = req.body;
  const user_id = req.headers["x-user-id"];
  
  const { categoryId, categoryName, description } = requestPayload || {};
  
  const auditObject = {
    user_id,
    module: module || 'TOPICS',
    sub_module: 'UPDATE_TOPIC',
    action: 'UPDATE',
    entity_id: categoryId,
    request_payload: requestPayload,
    modified_payload: modifiedPayload || null,
    status: 'PENDING',
    message: `Attempting to update topic ID: ${categoryId}`,
    jira_link: jiraLink,
    ip_address: getClientIp(req),
  };

  logger.info(`Updating topic ID: ${categoryId}`);
  
  try {
    // Validation
    if (!categoryId) {
      const errorResponse = {
        responseCode: "BAD_REQUEST",
        responseMessage: "Category ID is required",
      };
      
      await logAudit({
        ...auditObject,
        status: 'FAILURE',
        response_payload: errorResponse,
        message: 'Category ID is required',
      });
      
      res.status(400).json(errorResponse);
      return;
    }

    if (!categoryName || !categoryName.trim()) {
      const errorResponse = {
        responseCode: "BAD_REQUEST",
        responseMessage: "Category name is required",
      };
      
      await logAudit({
        ...auditObject,
        status: 'FAILURE',
        response_payload: errorResponse,
        message: 'Category name is required',
      });
      
      res.status(400).json(errorResponse);
      return;
    }

    const updateData: any = {
      categoryId,
      categoryName: categoryName.trim(),
      description: description?.trim() || "",
    };

    const response = await axios({
      method: "PUT",
      url: `${process.env.KONG_API_URL}/api/community/v1/category/update`,
      headers: createApiHeaders(req.user.token),
      data: updateData,
    });

    logger.info(`Successfully updated topic ID: ${categoryId}`);
    
    await logAudit({
      ...auditObject,
      status: 'SUCCESS',
      response_payload: response.data,
      message: `Successfully updated topic: ${categoryName}`,
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    const errorMessage = `Error updating topic ID: ${categoryId}`;
    logger.error(`❌ ${errorMessage}`);
    
    let errorResponse: any = { message: errorMessage, error: 'Internal Server Error' };
    let statusCode = 500;

    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status;
      errorResponse = {
        responseCode: "API_ERROR",
        responseMessage: errorMessage,
        error: error.response.data,
      };
      
      if (process.env.NODE_ENV !== 'production') {
        logger.error(`API Error details: ${JSON.stringify(error.response.data)}`);
      }
    } else if (error instanceof Error) {
      errorResponse = {
        responseCode: "SERVER_ERROR",
        responseMessage: "Internal server error",
        error: error.message,
      };
    }
    
    await logAudit({
      ...auditObject,
      status: 'FAILURE',
      response_payload: errorResponse,
      message: errorMessage,
    });
    
    res.status(statusCode).json(errorResponse);
  }
};

// Delete a topic
export const deleteTopic: RequestHandler = async (req: any, res: Response) => {
  const { jiraLink, module, requestPayload } = req.body;
  const user_id = req.headers["x-user-id"];
  
  const { categoryId } = requestPayload || {};
  
  const auditObject = {
    user_id,
    module: module || 'TOPICS',
    sub_module: 'DELETE_TOPIC',
    action: 'DELETE',
    entity_id: categoryId,
    request_payload: requestPayload,
    modified_payload: null,
    status: 'PENDING',
    message: `Attempting to delete topic ID: ${categoryId}`,
    jira_link: jiraLink,
    ip_address: getClientIp(req),
  };

  logger.info(`Deleting topic ID: ${categoryId}`);
  
  try {
    // Validation
    if (!categoryId) {
      const errorResponse = {
        responseCode: "BAD_REQUEST",
        responseMessage: "Category ID is required",
      };
      
      await logAudit({
        ...auditObject,
        status: 'FAILURE',
        response_payload: errorResponse,
        message: 'Category ID is required',
      });
      
      res.status(400).json(errorResponse);
      return;
    }

    const response = await axios({
      method: "DELETE",
      url: `${process.env.KONG_API_URL}/api/community/v1/category/delete/${categoryId}`,
      headers: createApiHeaders(req.user.token),
    });

    logger.info(`Successfully deleted topic ID: ${categoryId}`);
    
    await logAudit({
      ...auditObject,
      status: 'SUCCESS',
      response_payload: response.data,
      message: `Successfully deleted topic ID: ${categoryId}`,
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    const errorMessage = `Error deleting topic ID: ${categoryId}`;
    logger.error(`❌ ${errorMessage}`);
    
    let errorResponse: any = { message: errorMessage, error: 'Internal Server Error' };
    let statusCode = 500;

    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status;
      errorResponse = {
        responseCode: "API_ERROR",
        responseMessage: errorMessage,
        error: error.response.data,
      };
      
      if (process.env.NODE_ENV !== 'production') {
        logger.error(`API Error details: ${JSON.stringify(error.response.data)}`);
      }
    } else if (error instanceof Error) {
      errorResponse = {
        responseCode: "SERVER_ERROR",
        responseMessage: "Internal server error",
        error: error.message,
      };
    }
    
    await logAudit({
      ...auditObject,
      status: 'FAILURE',
      response_payload: errorResponse,
      message: errorMessage,
    });
    
    res.status(statusCode).json(errorResponse);
  }
};
