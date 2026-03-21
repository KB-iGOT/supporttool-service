import { Request, Response } from "express";
import { RequestHandler } from "express";
import axios from "axios";
import FormData from "form-data";
import logger from "../utils/logger";
import { createApiHeaders } from "../helpers/apiHelpers";

/**
 * Transform GCS storage URLs in the API response to portal CDN URLs.
 * Replaces: https://storage.googleapis.com/<bucket>/  →  <KONG_API_URL>/content-store/
 *
 * This keeps the rest of the path (orgStore/<orgId>/file.png) intact.
 */
const transformResponseUrls = (data: any): any => {
  if (!data?.result?.url) return data;
  const raw: string = data.result.url;
  const gcsMatch = raw.match(
    /^https?:\/\/storage\.googleapis\.com\/[^/]+\/(.*)/
  );
  if (gcsMatch) {
    const base = (process.env.KONG_API_URL || "").replace(/\/+$/, "");
    data.result.url = `${base}/content-store/${gcsMatch[1]}`;
  }
  return data;
};

/**
 * Upload asset to org store.
 *
 * Works for both KB Org and Other Org — the difference is the token:
 *   • KB Org   → uses the session user's token (req.user.token)
 *   • Other Org → client sends x-selected-user-token header
 *
 * Calls:  POST <KONG_API_URL>/api/storage/orgStoreUpload
 */
export const uploadOrgStore: RequestHandler = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file provided" });
      return;
    }

    // If the client passed a selected-user token (Other Org flow), use it;
    // otherwise fall back to the session user's own token (KB Org flow).
    const token: string =
      (req.headers["x-selected-user-token"] as string) || req.user.token;

    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const base = (process.env.KONG_API_URL || "").replace(/\/+$/, "");
    const uploadUrl = `${base}/api/storage/orgStoreUpload`;

    logger.info(`Uploading asset to ${uploadUrl}`);

    const response = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        "x-authenticated-user-token": token.trim(),
        Authorization: process.env.AUTHORIZATION || "",
      },
      timeout: 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    logger.info("Org store upload successful");
    const transformed = transformResponseUrls(response.data);
    res.status(200).json(transformed);
  } catch (error: any) {
    logger.error("Error in org store upload: " + error);
    if (error.response) {
      res.status(error.response.status).json({
        message: "Error from upload API",
        error: error.response.data,
      });
    } else {
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
};

/**
 * Fetch token for a selected user via Keycloak token-exchange.
 * Used by the "Other Org" flow so we can upload on behalf of an MDO user.
 */
export const getTokenForUser: RequestHandler = async (req: any, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ message: "userId is required" });
      return;
    }

    logger.info(`Fetching token for user: ${userId}`);

    const base = (process.env.KONG_API_URL || "").replace(/\/+$/, "");

    // 1. Get admin access token from Keycloak master realm
    const adminTokenParams = new URLSearchParams();
    adminTokenParams.append("client_id", "admin-cli");
    adminTokenParams.append("grant_type", "password");
    adminTokenParams.append("username", process.env.ADMIN_USERNAME || "");
    adminTokenParams.append("password", process.env.ADMIN_PASSWORD || "");

    const adminTokenRes = await axios.post(
      `${base}/auth/realms/master/protocol/openid-connect/token`,
      adminTokenParams,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const adminAccessToken = adminTokenRes.data.access_token;

    // 2. Exchange admin token for the target user's token
    const exchangeParams = new URLSearchParams();
    exchangeParams.append("client_id", process.env.KEYCLOAK_CLIENT_ID || "");
    exchangeParams.append("client_secret", process.env.KEYCLOAK_CLIENT_SECRET || "");
    exchangeParams.append("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange");
    exchangeParams.append("requested_subject", userId);
    exchangeParams.append("subject_token", adminAccessToken);
    exchangeParams.append("subject_token_type", "urn:ietf:params:oauth:token-type:access_token");

    const exchangeRes = await axios.post(
      `${base}/auth/realms/sunbird/protocol/openid-connect/token`,
      exchangeParams,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    res.status(200).json({ token: exchangeRes.data.access_token });
  } catch (error: any) {
    logger.error("Error getting user token: " + error);
    if (error.response) {
      res.status(error.response.status).json({
        message: "Error fetching user token",
        error: error.response.data,
      });
    } else {
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
};
