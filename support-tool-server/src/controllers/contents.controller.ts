import { Request, Response } from "express";
import pool from "../config/database";
import { RequestHandler } from "express";
import { userSession } from "../helpers/authHelper";
import axios from "axios"; // Use axios instead of request (which is deprecated)
import FormData from "form-data";
import logger from "../utils/logger";
import { Logger } from "winston";

export const getContents: RequestHandler = async (
  req: any,
  res: Response
) => {
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
  try {
    // Get the content ID from the request parameters
    const contentId = req.params.id;
    const link = req.query.jiraLink as string;

    if (!contentId) {
      res.status(400).json({
        status: 400,
        message: "Content ID is required",
      });
      return;
    }

    console.log(`Attempting to retire content with ID: ${contentId}`);

    // Make request to the learning service API
    const response = await axios({
      method: "DELETE",
      url: `http://${process.env.LEARNING_SERVICE_URL}/learning-service/content/v3/retire/${contentId}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.headers["x-authenticated-user-token"] || "",
      },
    });

    console.log(`Content retired successfully. ID: ${contentId}`);

    // Return the response from the learning service
    res.status(200).json({
      status: 200,
      message: "Content retired successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("❌ Error retiring content:", error);

    // Check if it's an axios error with response
    if ((error as any).response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const axiosError = error as any;
      res.status(axiosError.response.status).json({
        status: axiosError.response.status,
        message: "Error retiring content",
        error: axiosError.response.data,
      });
    } else if ((error as any).request) {
      // The request was made but no response was received
      res.status(503).json({
        status: 503,
        message: "No response from learning service API",
        error: "Service unavailable",
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({
        status: 500,
        message: "Internal server error while retiring content",
        error: (error as any).message,
      });
    }
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

    logger.info(`Content created successfully: ${JSON.stringify(response.data)}`);
    // If successful
    res.status(200).send(response.data);
  } catch (error) {
    logger.error("❌ Error creating content:"+ error);

    // Check if it's an axios error with response
    if ((error as any).response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const axiosError = error as any; // Explicitly cast error to any
      logger.error(`API Error response: ${JSON.stringify(axiosError.response.data)}`);
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
      // Something happened in setting up the request that triggered an Error
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
    logger.info(`Request files: ${req.files ? JSON.stringify(Object.keys(req.files)) : 'No files'}`);
    logger.info(`Request file: ${req.file ? req.file.originalname : 'No file'}`);
    
    // Check various locations where the file might be
    let fileData = null;
    let fileName = '';
    let mimeType = '';
    
    // Check if file is in the data field specifically (from your client)
    if (req.files && req.files.data) {
      fileData = req.files.data;
      fileName = req.files.data.name;
      mimeType = req.files.data.mimetype;
      logger.info(`Found file in req.files.data: ${fileName}, size: ${fileData.size}`);
    } 
    // Check if file is in the traditional multer location
    else if (req.file) {
      fileData = req.file.buffer;
      fileName = req.file.originalname;
      mimeType = req.file.mimetype;
      logger.info(`Found file in req.file: ${fileName}, size: ${fileData.length}`);
    }
    // Check if file is in the multipart array
    else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const file = req.files[0];
      fileData = file.buffer;
      fileName = file.originalname;
      mimeType = file.mimetype;
      logger.info(`Found file in req.files array: ${fileName}, size: ${fileData.length}`);
    }
    // Check if file is in a named field in files object
    else if (req.files && Object.keys(req.files).length > 0) {
      // Get the first file from any field
      const fieldName = Object.keys(req.files)[0];
      const file = req.files[fieldName];
      fileData = file.data || file.buffer;
      fileName = file.name || file.originalname;
      mimeType = file.mimetype;
      logger.info(`Found file in req.files.${fieldName}: ${fileName}, size: ${fileData.length || fileData.size}`);
    }
    
    // Check if file data was found
    if (!fileData) {
      logger.error("No file found in the request");
      res.status(400).json({
        status: 400,
        message: "No file provided for upload. Please ensure the file is included in the request.",
      });
      return;
    }
    
    // Create form data for file upload
    const formData = new FormData();
    
    // Add the file to form data
    formData.append('data', fileData, {
      filename: fileName,
      contentType: mimeType,
    });
    
    logger.info(`Preparing to upload file: ${fileName}, type: ${mimeType} for content ID: ${contentId}`);

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
      maxBodyLength: Infinity
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
    logger.error("❌ Error uploading content file:"+ error);

    // Check if it's an axios error with response
    if ((error as any).response) {
      const axiosError = error as any;
      logger.error(`API Error response: ${JSON.stringify(axiosError.response.data)}`);
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
    logger.info(`Update request body: ${JSON.stringify(req.body)}`);
    
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/private/content/v3/update`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: req.body, // Send the request body from client
    });

    logger.info(`Content updated successfully: ${JSON.stringify(response.data)}`);
    
    // If successful
    res.status(200).json({
      status: 200,
      message: "Content updated successfully",
      result: response.data,
    });
  } catch (error) {
    logger.error("❌ Error updating content:"+ error);

    // Check if it's an axios error with response
    if ((error as any).response) {
      const axiosError = error as any;
      logger.error(`API Error response: ${JSON.stringify(axiosError.response.data)}`);
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