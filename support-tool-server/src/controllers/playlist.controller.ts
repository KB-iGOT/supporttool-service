import { Request, Response, RequestHandler } from "express";
import axios from "axios";
import logger from "../utils/logger";
import logAudit from "../helpers/auditLogger";
import getClientIp from "../helpers/getClientIp";

// Create API headers
const createApiHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    accept: "*/*",
    Authorization: process.env.AUTHORIZATION || "",
    "x-authenticated-user-token": token ? token.trim() : "",
  };
  return headers;
};

// Handle API errors
function handleApiError(error: any, res: Response, logMessage: string) {
  logger.error(`❌ ${logMessage}`);

  if (error.response) {
    logger.error(`API Error status: ${error.response.status}`);
    if (process.env.NODE_ENV !== "production") {
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

// Search playlists
export const searchPlaylists: RequestHandler = async (req: any, res: Response) => {
  logger.info("Searching playlists");

  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/playList/v2/search`,
      headers: createApiHeaders(req.user.token),
      data: req.body,
    });

    logger.info("Successfully retrieved playlists");
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, "Error searching playlists");
  }
};

// Create a playlist
export const createPlaylist: RequestHandler = async (req: any, res: Response) => {
  const { jiraLink, module, requestPayload } = req.body;
  const user_id = req.headers["x-user-id"];

  const auditObject = {
    user_id,
    module: module || "PLAYLIST",
    sub_module: "CREATE_PLAYLIST",
    action: "CREATE",
    entity_id: requestPayload?.orgId || "",
    request_payload: requestPayload,
    modified_payload: null,
    status: "PENDING",
    message: `Attempting to create playlist for org: ${requestPayload?.orgId}`,
    jira_link: jiraLink,
    ip_address: getClientIp(req),
  };

  logger.info("Creating new playlist");

  try {
    if (!requestPayload?.type || !requestPayload?.orgId) {
      const errorResponse = {
        responseCode: "BAD_REQUEST",
        responseMessage: "type and orgId are required",
      };

      await logAudit({
        ...auditObject,
        status: "FAILURE",
        response_payload: errorResponse,
        message: "type and orgId are required",
      });

      res.status(400).json(errorResponse);
      return;
    }

    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/playList/v2/create`,
      headers: createApiHeaders(),
      data: requestPayload,
    });

    logger.info(`Successfully created playlist for org: ${requestPayload.orgId}`);

    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: response.data,
      message: `Successfully created playlist for org: ${requestPayload.orgId}`,
    });

    res.status(200).json(response.data);
  } catch (error) {
    const errorMessage = `Error creating playlist for org: ${requestPayload?.orgId}`;
    logger.error(`❌ ${errorMessage}`);

    let errorResponse: any = { message: errorMessage, error: "Internal Server Error" };
    let statusCode = 500;

    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status;
      errorResponse = {
        responseCode: "API_ERROR",
        responseMessage: errorMessage,
        error: error.response.data,
      };
    }

    await logAudit({
      ...auditObject,
      status: "FAILURE",
      response_payload: errorResponse,
      message: errorMessage,
    });

    res.status(statusCode).json(errorResponse);
  }
};

// Update a playlist
export const updatePlaylist: RequestHandler = async (req: any, res: Response) => {
  const { jiraLink, module, requestPayload } = req.body;
  const user_id = req.headers["x-user-id"];

  const auditObject = {
    user_id,
    module: module || "PLAYLIST",
    sub_module: "UPDATE_PLAYLIST",
    action: "UPDATE",
    entity_id: requestPayload?.orgId || "",
    request_payload: requestPayload,
    modified_payload: null,
    status: "PENDING",
    message: `Attempting to update playlist for org: ${requestPayload?.orgId}`,
    jira_link: jiraLink,
    ip_address: getClientIp(req),
  };

  logger.info("Updating playlist");

  try {
    if (!requestPayload?.type || !requestPayload?.orgId) {
      const errorResponse = {
        responseCode: "BAD_REQUEST",
        responseMessage: "type and orgId are required",
      };

      await logAudit({
        ...auditObject,
        status: "FAILURE",
        response_payload: errorResponse,
        message: "type and orgId are required",
      });

      res.status(400).json(errorResponse);
      return;
    }

    const response = await axios({
      method: "PUT",
      url: `${process.env.KONG_API_URL}/api/playList/update`,
      headers: createApiHeaders(req.user.token),
      data: requestPayload,
    });

    logger.info(`Successfully updated playlist for org: ${requestPayload.orgId}`);

    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: response.data,
      message: `Successfully updated playlist for org: ${requestPayload.orgId}`,
    });

    res.status(200).json(response.data);
  } catch (error) {
    const errorMessage = `Error updating playlist for org: ${requestPayload?.orgId}`;
    logger.error(`❌ ${errorMessage}`);

    let errorResponse: any = { message: errorMessage, error: "Internal Server Error" };
    let statusCode = 500;

    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status;
      errorResponse = {
        responseCode: "API_ERROR",
        responseMessage: errorMessage,
        error: error.response.data,
      };
    }

    await logAudit({
      ...auditObject,
      status: "FAILURE",
      response_payload: errorResponse,
      message: errorMessage,
    });

    res.status(statusCode).json(errorResponse);
  }
};

// Read a playlist
export const readPlaylist: RequestHandler = async (req: any, res: Response) => {
    debugger
  const { playlistKey, orgId } = req.params;

  logger.info(`Reading playlist: ${playlistKey} for org: ${orgId}`);

  try {
    if (!playlistKey || !orgId) {
      res.status(400).json({
        responseCode: "BAD_REQUEST",
        responseMessage: "Playlist Key and orgId are required",
      });
      return;
    }

    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/playList/read/${playlistKey}/${orgId}`,
      headers: createApiHeaders(),
    });

    logger.info(`Successfully read playlist: ${playlistKey}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, `Error reading playlist: ${playlistKey}`);
  }
};
