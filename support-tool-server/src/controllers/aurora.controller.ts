import { Request, Response, RequestHandler } from "express";
import axios from "axios";
import logger from "../utils/logger";
import { handleApiError } from "../helpers/apiHelpers";

const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WEEK_INDEX_PATTERN = /^\d+$/;

const sendBadRequest = (res: Response, responseMessage: string) => {
  res.status(400).json({ responseCode: "BAD_REQUEST", responseMessage });
};

// **Get Aurora AI dashboard overview (month / week / day metrics)**
export const getDashboardOverview: RequestHandler = async (req: Request, res: Response) => {
  const AURORA_CONFIG = {
    baseUrl: `${process.env.KONG_API_URL}/api/itsm/aurora/v1`,
    timeout: 30000,
  };

  // Set on the request by the userSession middleware
  const userToken: string | undefined = req.user?.token;
  if (!userToken) {
    res.status(401).json({ responseCode: "UNAUTHORIZED", responseMessage: "User token is missing" });
    return;
  }

  const { month, date, week_index } = req.query;
  logger.info(`Fetching Aurora dashboard overview with query: ${JSON.stringify(req.query)}`);
  const params: Record<string, string> = {};

  if (month !== undefined) {
    if (typeof month !== "string" || !MONTH_PATTERN.test(month)) {
      sendBadRequest(res, "month must be in YYYY-MM format");
      return;
    }
    params.month = month;
  }
  if (date !== undefined) {
    if (typeof date !== "string" || !DATE_PATTERN.test(date)) {
      sendBadRequest(res, "date must be in YYYY-MM-DD format");
      return;
    }
    params.date = date;
  }
  if (week_index !== undefined) {
    if (typeof week_index !== "string" || !WEEK_INDEX_PATTERN.test(week_index)) {
      sendBadRequest(res, "week_index must be a positive number");
      return;
    }
    params.week_index = week_index;
  }

  try {
    const response = await axios.get(`${AURORA_CONFIG.baseUrl}/dashboard/overview`, {
      params,
      headers: {
        "Content-Type": "application/json",
        // AUTHORIZATION in .env already includes the "Bearer " prefix
        Authorization: process.env.AUTHORIZATION,
      },
      timeout: AURORA_CONFIG.timeout,
    });
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, "Error fetching Aurora dashboard overview");
  }
};
