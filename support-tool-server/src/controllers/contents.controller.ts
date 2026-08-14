import { Request, Response } from "express";
import { cassandraClient } from "../utils/cassandra";
import { RequestHandler } from "express";
import { userSession } from "../helpers/authHelper";
import axios from "axios";
import FormData from "form-data";
import logger from "../utils/logger";
import { Logger } from "winston";
import logAudit from "../helpers/auditLogger";
import getClientIp from "../helpers/getClientIp";

export const getContents: RequestHandler = async (req: any, res: Response) => {
  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}api/content/v1/search`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },

      data: req.body, // Send the request body from client
    });

    // If successful
    res.status(200).send(response.data);
  } catch (error) {
    console.error("❌ Error fetching contents:", error);

    // Check if it's an axios error with response
    if ((error as any).response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const axiosError = error as any; // Explicitly cast error to any
      res.status(axiosError.response.status).json({
        message: "Error from content API",
        error: axiosError.response.data,
      });
    } else if ((error as any).request) {
      // The request was made but no response was received
      res.status(503).json({
        message: "No response from content API",
        error: "Service unavailable",
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({
        message: "Internal server error",
        error: (error as any).message,
      });
    }
  }
};

export const retireContents: RequestHandler = async (
  req: Request,
  res: Response
) => {
   const contentId = req.params.id;
    const { jiraLink, module } = req.query;
    const user_id = req.headers["x-user-id"];

    let auditObject = {
      user_id,
      module,
      sub_module: null,
      action: "DELETE",
      entity_id: contentId,
      request_payload: null,
      modified_payload: null,
      response_payload: null,
      ip_address: getClientIp(req),
      user_agent: null,
      status: null,
      message: null,
      jira_link: jiraLink,
    };

    console.log(auditObject);
  try {

    if (!contentId) {
      logger.error("Content ID is required for retirement");
      const response = {
        status: 400,
        message: "Content ID is required",
      };
      await logAudit({
        ...auditObject,
        status: "FAILURE",
        response_payload: JSON.stringify(response),
        message: response.message,
      });

      res.status(400).json(response);
      return;
    }

   logger.info(`Attempting to retire content with ID: ${contentId}`);

    // Make request to the learning service API
    const response = await axios({
      method: "DELETE",
      url: `http://${process.env.LEARNING_SERVICE_URL}/learning-service/content/v3/retire/${contentId}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token":
          req.headers["x-authenticated-user-token"] || "",
      },
    });

    logger.info(`Content retired successfully. ID: ${contentId}`);

    const responseData = {
      status: 200,
      message: "Content retired successfully",
      data: response.data,
    };

    await logAudit({
        ...auditObject,
        status: "SUCCESS",
        response_payload: JSON.stringify(responseData),
        message: responseData.message,
      });
    // Return the response from the learning service
    res.status(200).json(responseData);

  } catch (error) {
    let errorState: any = {};
    let errorStatus = 0;
    // Check if it's an axios error with response
    if ((error as any).response) {
      const axiosError = error as any;

      errorState = {
        status: axiosError.response.status,
        message: "Error retiring content",
        error: axiosError.response.data,
      };

      errorStatus = axiosError.response.status;
    } else if ((error as any).request) {
      // The request was made but no response was received
      errorState = {
        status: 503,
        message: "No response from learning service API",
        error: "Service unavailable",
      };
      errorStatus = 503;
    } else {
      errorState = {
        status: 500,
        message: "Internal server error while retiring content",
        error: (error as any).message,
      };
      errorStatus = 500;
      // Something happened in setting up the request that triggered an Error
    }
    logger.error("❌ Error retiring content:" + JSON.stringify(errorState));
    await logAudit({
        ...auditObject,
        status: "FAILURE",
        response_payload: JSON.stringify(errorState),
        message: errorState.message,
      });
    res.status(errorStatus).json(errorState);
  }
};

export const createPrivateContents: RequestHandler = async (
  req: any,
  res: Response
) => {
  logger.info("Creating private content");
  try {
    logger.info(`Request body: ${JSON.stringify(req.body)}`);

    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/private/content/v3/create`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: req.body, // Send the request body from client
    });

    logger.info(
      `Content created successfully: ${JSON.stringify(response.data)}`
    );
    // If successful
    res.status(200).send(response.data);
  } catch (error) {
    logger.error("❌ Error creating content:" + error);

    // Check if it's an axios error with response
    if ((error as any).response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const axiosError = error as any; // Explicitly cast error to any
      logger.error(
        `API Error response: ${JSON.stringify(axiosError.response.data)}`
      );
      res.status(axiosError.response.status).json({
        message: "Error from content API",
        error: axiosError.response.data,
      });
    } else if ((error as any).request) {
      // The request was made but no response was received
      logger.error("No response received from API");
      res.status(503).json({
        message: "No response from content API",
        error: "Service unavailable",
      });
    } else {
      logger.error(`Request setup error: ${(error as any).message}`);
      res.status(500).json({
        message: "Internal server error",
        error: (error as any).message,
      });
    }
  }
};

export const uploadPrivateContentFile: RequestHandler = async (
  req: any,
  res: Response
) => {
  logger.info("Starting file upload for private content");
  try {
    // Get the content ID from the request parameters
    const contentId = req.params.id;
    logger.info(`Content ID for upload: ${contentId}`);

    if (!contentId) {
      logger.warn("Missing content ID in upload request");
      res.status(400).json({
        status: 400,
        message: "Content ID is required for upload",
      });
      return;
    }

    // Log request details for debugging
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    logger.info(
      `Request files: ${
        req.files ? JSON.stringify(Object.keys(req.files)) : "No files"
      }`
    );
    logger.info(
      `Request file: ${req.file ? req.file.originalname : "No file"}`
    );

    // Check various locations where the file might be
    let fileData = null;
    let fileName = "";
    let mimeType = "";

    // Check if file is in the data field specifically (from your client)
    if (req.files && req.files.data) {
      fileData = req.files.data;
      fileName = req.files.data.name;
      mimeType = req.files.data.mimetype;
      logger.info(
        `Found file in req.files.data: ${fileName}, size: ${fileData.size}`
      );
    }
    // Check if file is in the traditional multer location
    else if (req.file) {
      fileData = req.file.buffer;
      fileName = req.file.originalname;
      mimeType = req.file.mimetype;
      logger.info(
        `Found file in req.file: ${fileName}, size: ${fileData.length}`
      );
    }
    // Check if file is in the multipart array
    else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const file = req.files[0];
      fileData = file.buffer;
      fileName = file.originalname;
      mimeType = file.mimetype;
      logger.info(
        `Found file in req.files array: ${fileName}, size: ${fileData.length}`
      );
    }
    // Check if file is in a named field in files object
    else if (req.files && Object.keys(req.files).length > 0) {
      // Get the first file from any field
      const fieldName = Object.keys(req.files)[0];
      const file = req.files[fieldName];
      fileData = file.data || file.buffer;
      fileName = file.name || file.originalname;
      mimeType = file.mimetype;
      logger.info(
        `Found file in req.files.${fieldName}: ${fileName}, size: ${
          fileData.length || fileData.size
        }`
      );
    }

    // Check if file data was found
    if (!fileData) {
      logger.error("No file found in the request");
      res.status(400).json({
        status: 400,
        message:
          "No file provided for upload. Please ensure the file is included in the request.",
      });
      return;
    }

    // Create form data for file upload
    const formData = new FormData();

    // Add the file to form data
    formData.append("data", fileData, {
      filename: fileName,
      contentType: mimeType,
    });

    logger.info(
      `Preparing to upload file: ${fileName}, type: ${mimeType} for content ID: ${contentId}`
    );

    // Make request to the content API
    const apiUrl = `${process.env.KONG_API_URL}/api/private/content/v3/upload/${contentId}`;
    logger.info(`Making request to: ${apiUrl}`);

    const response = await axios({
      method: "POST",
      url: apiUrl,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
        ...formData.getHeaders(),
      },
      data: formData,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    logger.info(`File uploaded successfully for content ID: ${contentId}`);
    logger.info(`Upload response: ${JSON.stringify(response.data)}`);

    // Return the response from the content API
    res.status(200).json({
      status: 200,
      message: "File uploaded successfully",
      result: response.data,
    });
  } catch (error) {
    logger.error("❌ Error uploading content file:" + error);

    // Check if it's an axios error with response
    if ((error as any).response) {
      const axiosError = error as any;
      logger.error(
        `API Error response: ${JSON.stringify(axiosError.response.data)}`
      );
      res.status(axiosError.response.status).json({
        status: axiosError.response.status,
        message: "Error uploading file",
        error: axiosError.response.data,
      });
    } else if ((error as any).request) {
      logger.error("No response received from API");
      res.status(503).json({
        status: 503,
        message: "No response from content API",
        error: "Service unavailable",
      });
    } else {
      logger.error(`Request setup error: ${(error as any).message}`);
      res.status(500).json({
        status: 500,
        message: "Internal server error while uploading file",
        error: (error as any).message,
      });
    }
  }
};

export const updatePrivateContent: RequestHandler = async (
  req: any,
  res: Response
) => {
  logger.info("Updating private content");
  try {
    logger.info(
      `${req.params.id} Update request body: ${JSON.stringify(req.body)}`
    );

    const response = await axios({
      method: "PATCH",
      url: `${process.env.KONG_API_URL}/api/private/content/v3/update/${req.params.id}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: req.body, // Send the request body from client
    });

    logger.info(
      `Content updated successfully: ${JSON.stringify(response.data)}`
    );

    // If successful
    res.status(200).json({
      status: 200,
      message: "Content updated successfully",
      result: response.data,
    });
  } catch (error) {
    logger.error("❌ Error updating content:" + error);

    // Check if it's an axios error with response
    if ((error as any).response) {
      const axiosError = error as any;
      logger.error(
        `API Error response: ${JSON.stringify(axiosError.response.data)}`
      );
      res.status(axiosError.response.status).json({
        status: axiosError.response.status,
        message: "Error updating content",
        error: axiosError.response.data,
      });
    } else if ((error as any).request) {
      logger.error("No response received from API");
      res.status(503).json({
        status: 503,
        message: "No response from content API",
        error: "Service unavailable",
      });
    } else {
      logger.error(`Request setup error: ${(error as any).message}`);
      res.status(500).json({
        status: 500,
        message: "Internal server error while updating content",
        error: (error as any).message,
      });
    }
  }
};

export const deletePrivateContent: RequestHandler = async (
  req: any,
  res: Response
) => {
  logger.info(`Retiring private content with ID: ${req.params.id}`);

  try {
    // Validate that we have a content ID
    if (!req.params.id) {
      logger.warn("Missing content ID in retire request");
      res.status(400).json({
        status: 400,
        message: "Content ID is required for retirement",
      });
      return;
    }

    // Log the retirement request
    logger.info(`Retire request for content ID ${req.params.id}`);

    // Make the API call to retire the content - no body, only parameter
    const response = await axios({
      method: "DELETE",
      url: `${process.env.KONG_API_URL}/api/private/content/v3/retire/${req.params.id}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      // No data parameter, only using URL params
    });

    logger.info(
      `Content retired successfully: ${JSON.stringify(response.data)}`
    );

    // Return success response
    res.status(200).json({
      status: 200,
      message: "Content retired successfully",
      responseCode: "OK",
      result: response.data,
    });
  } catch (error) {
    logger.error(`❌ Error retiring content: ${error}`);

    // Check if it's an axios error with response
    if ((error as any).response) {
      const axiosError = error as any;
      logger.error(
        `API Error response: ${JSON.stringify(axiosError.response.data)}`
      );
      res.status(axiosError.response.status).json({
        status: axiosError.response.status,
        message: "Error retiring content",
        error: axiosError.response.data,
      });
    } else if ((error as any).request) {
      logger.error("No response received from API");
      res.status(503).json({
        status: 503,
        message: "No response from content API",
        error: "Service unavailable",
      });
    } else {
      logger.error(`Request setup error: ${(error as any).message}`);
      res.status(500).json({
        status: 500,
        message: "Internal server error while retiring content",
        error: (error as any).message,
      });
    }
  }
};

export const readPrivateContent: RequestHandler = async (
  req: any,
  res: Response
) => {
  logger.info(`Reading private content with ID: ${req.params.id}`);

  try {
    // Validate that we have a content ID
    if (!req.params.id) {
      logger.warn("Missing content ID in read request");
      res.status(400).json({
        status: 400,
        message: "Content ID is required to read content",
      });
      return;
    }

    // Log the read request
    logger.info(`Read request for content ID ${req.params.id}`);

    // Make the API call to read the content - no body, only parameter
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/private/content/v3/read/${req.params.id}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      // No data parameter, only using URL params
    });

    logger.info(`Content read successfully: ${JSON.stringify(response.data)}`);

    // Return success response
    res.status(200).json({
      status: 200,
      message: "Content read successfully",
      responseCode: "OK",
      result: response.data,
    });
  } catch (error) {
    logger.error(`❌ Error reading content: ${error}`);

    // Check if it's an axios error with response
    if ((error as any).response) {
      const axiosError = error as any;
      logger.error(
        `API Error response: ${JSON.stringify(axiosError.response.data)}`
      );
      res.status(axiosError.response.status).json({
        status: axiosError.response.status,
        message: "Error reading content",
        error: axiosError.response.data,
      });
    } else if ((error as any).request) {
      logger.error("No response received from API");
      res.status(503).json({
        status: 503,
        message: "No response from content API",
        error: "Service unavailable",
      });
    } else {
      logger.error(`Request setup error: ${(error as any).message}`);
      res.status(500).json({
        status: 500,
        message: "Internal server error while reading content",
        error: (error as any).message,
      });
    }
  }
};

export const getContentHierarchy: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { identifier } = req.params;  

  if (!identifier) {
    logger.warn("Content hierarchy request received without an identifier.");
    res.status(400).json({ message: "Identifier is required" });
    return;
  }

  logger.info(`Fetching content hierarchy for identifier: ${identifier}`);

  try {
    const query = `SELECT * FROM prod_hierarchy_store.content_hierarchy WHERE identifier = ?`;
    const result = await cassandraClient.execute(query, [identifier], { prepare: true });
    const rows = result.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      logger.info(`No content hierarchy found for identifier: ${identifier}`);
      res.status(404).json({ message: `No content hierarchy found for identifier: ${identifier}` });
      return;
    }

    res.status(200).json(rows);
  } catch (error) {
    logger.error(`Error fetching content hierarchy: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateContentHierarchy: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { identifier } = req.params;
  const { hierarchy, jiraLink } = req.body;
  const user_id = req.headers["x-user-id"] as string;

  const auditObject = {
    user_id,
    module: "Content Hierarchy",
    action: "UPDATE",
    entity_id: identifier,
    request_payload: { identifier, hierarchy, jiraLink },
    jira_link: jiraLink,
    ip_address: getClientIp(req),
  };

  if (!identifier || !hierarchy) {
    logger.warn("Update content hierarchy request received with missing data.");
    await logAudit({ ...auditObject, status: "FAILURE", message: "Identifier and hierarchy are required" });
    res.status(400).json({ message: "Identifier and hierarchy are required" });
    return;
  }

  logger.info(`Updating content hierarchy for identifier: ${identifier}`);

  try {
    const query = `UPDATE prod_hierarchy_store.content_hierarchy SET hierarchy = ? WHERE identifier = ?`;
    // Cassandra expects the JSON to be a string
    await cassandraClient.execute(query, [JSON.stringify(hierarchy), identifier], { prepare: true });

    logger.info(`Successfully updated content hierarchy for identifier: ${identifier}`);
    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      message: "Content hierarchy updated successfully",
    });

    res.status(200).json({ message: "Content hierarchy updated successfully" });
  } catch (error) {
    logger.error(`Error updating content hierarchy: ${error}`);
    await logAudit({ ...auditObject, status: "FAILURE", message: String(error) });
    res.status(500).json({ message: "Internal server error" });
  }
};

export const readContentDetails: RequestHandler = async (req: any, res: Response) => {
  const { identifier } = req.params;
  
  logger.info(`Fetching content details for identifier: ${identifier}`);

  try {
    if (!identifier) {
      logger.error("Content identifier is required");
      res.status(400).json({ message: "Content identifier is required" });
      return;
    }

    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/action/content/v3/read/${identifier}`,
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json, text/plain, */*",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
        "cache-control": "no-cache",
        "pragma": "no-cache",
      },
    });

    logger.info(`Successfully fetched content details for identifier: ${identifier}`);
    res.status(200).json(response.data);
  } catch (error) {
    logger.error(`Error fetching content details: ${error}`);
    
    if ((error as any).response) {
      const axiosError = error as any;
      res.status(axiosError.response.status).json({
        message: "Error from content API",
        error: axiosError.response.data,
      });
    } else if ((error as any).request) {
      res.status(503).json({
        message: "No response from content API",
        error: "Service unavailable",
      });
    } else {
      res.status(500).json({
        message: "Internal server error",
        error: (error as any).message,
      });
    }
  }
};

export const updateBatch: RequestHandler = async (req: any, res: Response) => {
  const { request, jiraLink, module } = req.body;
  const user_id = req.headers["x-user-id"];

  const auditObject = {
    user_id,
    module: module || 'CONTENTS',
    sub_module: 'UPDATE_BATCH',
    action: 'UPDATE',
    entity_id: request?.id,
    request_payload: request,
    modified_payload: null,
    response_payload: null,
    status: 'PENDING',
    message: `Attempting to update batch: ${request?.id}`,
    jira_link: jiraLink,
    ip_address: getClientIp(req),
  };

  logger.info(`Updating batch with ID: ${request?.id}`);

  try {
    if (!request || !request.id) {
      logger.error("Batch request data is required");
      const errorResponse = {
        message: "Batch request data is required",
      };
      
      await logAudit({
        ...auditObject,
        status: 'FAILURE',
        response_payload: JSON.stringify(errorResponse),
        message: errorResponse.message,
      });

      res.status(400).json(errorResponse);
      return;
    }

    const response = await axios({
      method: "PATCH",
      url: `${process.env.KONG_API_URL}/api/course/v1/batch/update`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhMTk5WXh3UkxNQWpBb3JVRmJUSkl4YjZDWE1JdUk4WVp4Y0pLaGxMdHQwIn0.eyJqdGkiOiI5MTdhMDA5OS1jMjgxLTQzMDQtOTQ1Yi04ZDY1ZDkzYmFlMGYiLCJleHAiOjE3NjM3MjIzODYsIm5iZiI6MCwiaWF0IjoxNzYzNTQ5NTg2LCJpc3MiOiJodHRwczovL3BvcnRhbC51YXQua2FybWF5b2dpYmhhcmF0Lm5ldC9hdXRoL3JlYWxtcy9zdW5iaXJkIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImY6OTFlYzk1ZDItYTNkNS00MTNlLWI0ZTQtNTNiMGRjYzk2NDg1OmNlZWMwMmM2LWMxOTEtNDlmZS04NDU2LTY2MjQ1YTlhNzgzNSIsInR5cCI6IkJlYXJlciIsImF6cCI6InN1cHBvcnRfaWdvdCIsImF1dGhfdGltZSI6MCwic2Vzc2lvbl9zdGF0ZSI6ImFmZmQxODcxLTMyNTQtNDY3ZC1iZGIxLTYxMTU2NTEyNzA2MyIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoiIiwibmFtZSI6IlNwdiBBZG1pbiIsInByZWZlcnJlZF91c2VybmFtZSI6InNwdmFkbWluX2pnMnkiLCJnaXZlbl9uYW1lIjoiU3B2IEFkbWluIiwiZmFtaWx5X25hbWUiOiIiLCJlbWFpbCI6InNwKioqKioqKioqKipAeW9wbWFpbC5jb20ifQ.vTB7IZb2wsF6abg6kib4dBZZGhTs2b3BC93OCNLPZIL9lgUDRrK9PGCOJoS6Z-BSF0jFBNxmO58IfMgZENSQJOO95APzwj9RsxPhaWH44W2ot4Azkp8bjFVACh-S6bxy2GFLJ6VVieNRQ3QUC2zHzfjMXBNNhXBR48qi7eoT8OGpsZ9I0xtEQEss3nw8BmtOSMVBQva6Rzp4LAhHLaEspGpMKDrOX6lLOIKAAbHO7cpFHOFdwqTtIMplPXP03okx4Awah3CBer6THL82yCvRdyeVBZJYYOg42YsVxkZ8E1XMtdxBBZmEQEihNNhfbnDslP6V72qmgmlTIOoQ1ikCqg",
      },
      data: { request },
    });

    logger.info(`Successfully updated batch with ID: ${request.id}`);
    
    await logAudit({
      ...auditObject,
      status: 'SUCCESS',
      response_payload: JSON.stringify(response.data),
      message: `Successfully updated batch: ${request.id}`,
    });

    res.status(200).json(response.data);
  } catch (error) {
    logger.error(`Error updating batch: ${error}`);
    
    const errorMessage = `Error updating batch: ${request?.id}`;
    let errorResponse: any = { message: errorMessage, error: 'Internal Server Error' };
    let statusCode = 500;

    if ((error as any).response) {
      const axiosError = error as any;
      statusCode = axiosError.response.status;
      errorResponse = {
        message: "Error from batch API",
        error: axiosError.response.data,
      };
    } else if ((error as any).request) {
      statusCode = 503;
      errorResponse = {
        message: "No response from batch API",
        error: "Service unavailable",
      };
    } else {
      errorResponse = {
        message: "Internal server error",
        error: (error as any).message,
      };
    }

    await logAudit({
      ...auditObject,
      status: 'FAILURE',
      response_payload: JSON.stringify(errorResponse),
      message: errorMessage,
    });

    res.status(statusCode).json(errorResponse);
  }
};



export const getAccessSettings: RequestHandler = async (req: any, res: Response) => {
  const { identifier } = req.params;
  
  logger.info(`Fetching access settings for identifier: ${identifier}`);

  try {
    if (!identifier) {
      logger.warn("Access settings request received without an identifier.");
      res.status(400).json({ message: "Identifier is required" });
      return;
    }

    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/accessSettings/read/${identifier}`,
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
    });

    logger.info(`Successfully fetched access settings for identifier: ${identifier}`);
    res.status(200).json(response.data);
  } catch (error) {
    logger.error(`Error fetching access settings: ${error}`);
    
    if ((error as any).response) {
      const axiosError = error as any;
      res.status(axiosError.response.status).json({
        message: "Error fetching access settings",
        error: axiosError.response.data,
      });
    } else if ((error as any).request) {
      res.status(503).json({
        message: "No response from access settings API",
        error: "Service unavailable",
      });
    } else {
      res.status(500).json({
        message: "Internal server error",
        error: (error as any).message,
      });
    }
  }
};
