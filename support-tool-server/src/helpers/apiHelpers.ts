import axios from "axios";
import logger from "../utils/logger";

/**
 * Builds standard API request headers.
 * If a token is provided it is set as x-authenticated-user-token.
 */
export const createApiHeaders = (token?: string): Record<string, string> => {

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": process.env.AUTHORIZATION || "",
  };

  if (token) {
    headers["x-authenticated-user-token"] = token.trim();
  }

  return headers;
};

/**
 * Fetches an admin (or user-specific) access token from Keycloak.
 * When userEmail is provided the token is fetched for that user.
 * When omitted the configured ADMIN_USERNAME / ADMIN_PASSWORD credentials are used.
 */
export const fetchAdminAccessToken = async (userEmail?: string): Promise<string> => {

  try {
    if (!process.env.ADMIN_CLIENT_ID || !process.env.ADMIN_CLIENT_SECRET) {
      throw new Error("Admin credentials not configured in environment variables");
    }

    const params = new URLSearchParams();
    params.append("client_id", process.env.ADMIN_CLIENT_ID);
    params.append("client_secret", process.env.ADMIN_CLIENT_SECRET);

    const adminUsername = process.env.ADMIN_USERNAME?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (adminUsername && adminPassword) {
      params.append("grant_type", "password");
      params.append("username", adminUsername);
      params.append("password", adminPassword);
    } else {
      if (!process.env.ADMIN_GRANT_TYPE) {
        throw new Error("Admin grant type not configured in environment variables");
      }
      params.append("grant_type", process.env.ADMIN_GRANT_TYPE);
    }

    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}/auth/realms/sunbird/protocol/openid-connect/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: params,
    });

    logger.info("Admin access token retrieved successfully");
    return response.data.access_token;
  } catch (error) {
    logger.error("❌ Error fetching admin access token");
    throw error;
  }
};
