import { Request, Response } from "express";
import pool from "../config/database";
import { RequestHandler } from "express";
import { userSession } from "../helpers/authHelper";
import axios from "axios"; // Use axios instead of request (which is deprecated)

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



