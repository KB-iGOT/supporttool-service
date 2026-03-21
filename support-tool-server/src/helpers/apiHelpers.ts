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
  logger.info(`Fetching admin access token${userEmail ? ` for user: ${userEmail}` : " for system admin"}`);

  try {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      throw new Error("Admin credentials not configured in environment variables");
    }

    const params = new URLSearchParams();
    params.append("client_id", "admin-cli");
    params.append("grant_type", "password");

    if (userEmail) {
      params.append("username", userEmail);
    } else {
      params.append("username", process.env.ADMIN_USERNAME);
      params.append("password", process.env.ADMIN_PASSWORD);
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
