import { Request, Response } from "express";
import { RequestHandler } from "express";
import { userSession } from "../helpers/authHelper";
import axios from "axios"; // Use axios instead of request (which is deprecated)

export const getUsers: RequestHandler = async (req: any, res: Response) => {
  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/private/user/v1/search`,
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

export const updateUser: RequestHandler = async (
  req: any,
  res: Response
) => {
  const targetUserId = req.params.userId;
  const updatedFields = req.body.request;

  if (!targetUserId) {
    res.status(400).json({
      responseCode: "CLIENT_ERROR",
      responseMessage: "User ID is required",
    });
    return;
  }
  try {
    // Call the actual user update API
    const response = await axios({
      method: "PATCH",
      url: `${process.env.KONG_API_URL}/api/user/private/v1/update`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: req.body,
    });

    // Log successful updates
    console.log(
      `✅ User ${targetUserId} updated successfully with fields:`,
      updatedFields
    );

    // If successful, send the response
    res.status(200).json(response.data);
  } catch (error) {
    console.error("❌ Error updating user:", error);

    if ((error as any).response) {
      const axiosError = error as any;
      console.error("API Response Error:", {
        status: axiosError.response.status,
        data: axiosError.response.data,
      });

      res.status(axiosError.response.status).json({
        responseCode: "API_ERROR",
        responseMessage:
          axiosError.response.data.message || "Error from user API",
        error: axiosError.response.data,
      });
    } else if ((error as any).request) {
      console.error("API Request Error (No Response)");

      res.status(503).json({
        responseCode: "SERVICE_UNAVAILABLE",
        responseMessage:
          "No response from user API. The service might be down or unreachable.",
      });
    } else {
      console.error("General Error:", (error as any).message);

      res.status(500).json({
        responseCode: "SERVER_ERROR",
        responseMessage:
          "Internal server error while processing the update request",
        error: (error as any).message,
      });
    }
  }
};



export const getUserByEmail: RequestHandler = async (req: any, res: Response) => {
  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/private/user/v1/search`,
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