import { Request, Response } from "express";
import pool from "../config/database";
import { RequestHandler } from "express";
import { userSession } from "../helpers/authHelper";
import axios from "axios"; // Use axios instead of request (which is deprecated)
import { fetchAdminAccessToken } from "../helpers/apiHelpers";

export const getList: RequestHandler = async (req: any, res: Response) => {
  try {
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}api/data/v1/system/settings/list`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
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

export const getConfig: RequestHandler = async (
  req: any,
  res: Response
) => {
  try {
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}api/data/v1/system/settings/get/${req.params.id}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
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

export const updateConfig: RequestHandler = async (
  req: any,
  res: Response
) => {
  console.log("Updating system settings with data:", req.body);
  try {
    const adminToken = await fetchAdminAccessToken();

    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}api/data/v1/system/settings/set`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": adminToken,
      },
      data: req.body,
    });

    // If successful
    res.status(200).send({ ...response.data });
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
