import request from "request";
import pool from "../config/database";
import logger from "../utils/logger";
import getClientIp from "../helpers/getClientIp";

// Helper function to check if URL is valid
const isValidUrl = (string: string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const getUserFromDB = async (email: string) => {
  let users = await pool.query(
    'SELECT * FROM users WHERE "email" = $1',
    [email]
  );
  if( users.rows && users.rows[0] && users.rows[0] .id) {
    const userId = users.rows[0].id;

    const userRoles = await pool.query(
      `SELECT 
    r.id AS role_id,
    r.name AS role_name
FROM 
    roles r
WHERE 
    r.id = ANY(
        SELECT unnest(role_ids) 
        FROM user_roles 
        WHERE user_id = $1)`,
      [userId]
    );

    const userRolePermission = await pool.query(
      `SELECT
    r.id AS role_id,
    r.name AS role_name,
    m.id AS module_id,
    m.name AS module_name,
    m.url AS module_url,
    rp.can_read,
    rp.can_write,
    rp.can_delete
FROM 
    users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON r.id = ANY(ur.role_ids)
JOIN role_permissions rp ON rp.role_id = r.id
JOIN modules m ON m.id = rp.module_id
WHERE
    u.id = $1;`,
      [userId]
    );
    console.log("userRoles", userRoles.rows);
     users.rows[0]["roles"] = userRoles?.rows?.length ? userRoles?.rows: [];
     console.log("userRoles", userRolePermission.rows);
      users.rows[0]["rolePermissions"] = userRolePermission?.rows?.length ? userRolePermission?.rows: [];
  }
  console.log("users", users,users.rows[0]);
  return users.rows[0];
};

const authenticateWithKeycloak = (email: string, password: string) => {
  return new Promise((resolve, reject) => {
    // Validate required environment variables
    if (!process.env.KONG_API_URL) {
      logger.error("KONG_API_URL environment variable is not set");
      return reject(new Error("Server configuration error: KONG_API_URL not configured"));
    }
    if (!process.env.KEYCLOAK_CLIENT_ID) {
      logger.error("KEYCLOAK_CLIENT_ID environment variable is not set");
      return reject(new Error("Server configuration error: KEYCLOAK_CLIENT_ID not configured"));
    }
    if (!process.env.KEYCLOAK_CLIENT_SECRET) {
      logger.error("KEYCLOAK_CLIENT_SECRET environment variable is not set");
      return reject(new Error("Server configuration error: KEYCLOAK_CLIENT_SECRET not configured"));
    }

    const authUrl = `${process.env.KONG_API_URL}auth/realms/sunbird/protocol/openid-connect/token`;
    
    // Validate URL format
    if (!isValidUrl(authUrl)) {
      logger.error(`Invalid Keycloak URL: ${authUrl}`);
      return reject(new Error("Server configuration error: Invalid Keycloak URL"));
    }
    
    logger.info(`Attempting Keycloak authentication for user: ${email}`);
    logger.info(`Keycloak URL: ${authUrl}`);

    const options = {
      method: "POST",
      url: authUrl,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Support-Tool-Server/1.0"
      },
      form: {
        client_id: process.env.KEYCLOAK_CLIENT_ID,
        password: password,
        grant_type: "password",
        username: email,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
      },
      timeout: 30000, // 30 seconds timeout
    };

    request(options, (error, response) => {
      if (error) {
        logger.error("Network error during Keycloak authentication: " + error.message);
        return reject(error);
      }

      // Log response status and body for debugging
      logger.info(`Keycloak response status: ${response.statusCode}`);
      logger.info(`Keycloak response body: ${response.body?.substring(0, 500)}...`);

      // Check if response status is not successful
      if (response.statusCode !== 200) {
        logger.error(`Keycloak authentication failed with status ${response.statusCode}: ${response.body}`);
        return reject(new Error(`Authentication failed: HTTP ${response.statusCode}`));
      }

      // Check if response body exists
      if (!response.body) {
        logger.error("Empty response body from Keycloak");
        return reject(new Error("Empty response from authentication server"));
      }

      // Check if response is HTML (error page)
      if (response.body.trim().startsWith('<html') || response.body.trim().startsWith('<!DOCTYPE')) {
        logger.error("Received HTML response instead of JSON from Keycloak");
        return reject(new Error("Authentication server returned an error page. Please check server configuration."));
      }

      let responseBody;
      try {
        responseBody = JSON.parse(response.body);
      } catch (parseError) {
        logger.error("Failed to parse Keycloak response as JSON: " + parseError);
        logger.error("Response body: " + response.body);
        return reject(new Error("Invalid JSON response from authentication server"));
      }

      if (responseBody.error) {
        logger.error("Keycloak returned error: " + responseBody.error);
        return reject(new Error(responseBody.error_description || responseBody.error));
      }

      if (!responseBody.access_token) {
        logger.error("No access token in Keycloak response");
        return reject(new Error("Authentication successful but no access token received"));
      }

      logger.info("Successfully obtained access token from Keycloak");
      resolve(responseBody.access_token);
    });
  });
};

const createSessionData = (user: any, token: string) => {
  const data = {
    id: user.id,
    userId: user.userId,
    userName: user.username,
    name: user.firstName + (user.lastName ? " " + user.lastName : ""),
    token: token,
    roles: user.roles,
    rolePermissions: user.rolePermissions,
    email: user.email,
  };
  console.log("Session Data Created: ", data);
  return data;
};

const saveSession = (req: any, sessionData: any) => {
  return new Promise((resolve, reject) => {
    req.session.user = sessionData;
    req.session.save((err: any) => {
      if (err) {
        logger.error("Session error: " + JSON.stringify(err));
        return reject(err);
      }
      resolve(true);
    });
  });
};

export const authenticateKeycloakUser = async (req: any, res: any) => {
  try {
    const { username, password } = req.body;
    
    // Validate request body
    if (!username || !password) {
      logger.warn("Authentication request missing username or password");
      return res.status(400).send({ 
        status: 400, 
        message: "Username and password are required" 
      });
    }
    
    logger.info("Received authentication request for username: " + username);

    // Step 1: Check if user exists in the database
    logger.info("Checking if user exists in the database...");
    const user = await getUserFromDB(username);
    if (!user) {
      logger.warn("User not found in the database: " + username);
      return res.status(401).send({ message: "Given username does not have access to support tool. Kindly contact SUPPORT ADMIN for the access." });
    }
    logger.info("User found in the database: " + username);

    // Step 2: Authenticate user with Keycloak
    logger.info("Authenticating user with Keycloak...");
    let token: any;
    try {
      token = await authenticateWithKeycloak(username, password);
      if (!token) {
        logger.warn("Authentication failed with Keycloak for username: " + username);
        return res.status(401).send({
          message: "Authentication failed with Keycloak. Please check your credentials.",
        });
      }
      logger.info("Authentication successful with Keycloak for username: " + username);
    } catch (authError: any) {
      logger.error("Keycloak authentication error for username " + username + ": " + authError.message);
      
      // Provide specific error messages based on the error type
      if (authError.message.includes("Server configuration error")) {
        return res.status(500).send({
          message: "Authentication server configuration error. Please contact system administrator.",
        });
      } else if (authError.message.includes("Authentication server returned an error page")) {
        return res.status(503).send({
          message: "Authentication service is currently unavailable. Please try again later.",
        });
      } else if (authError.message.includes("Invalid JSON response")) {
        return res.status(503).send({
          message: "Authentication service error. Please contact system administrator.",
        });
      } else if (authError.message.includes("HTTP")) {
        return res.status(401).send({
          message: "Invalid credentials. Please check your username and password.",
        });
      } else {
        return res.status(401).send({
          message: "Authentication failed. Please check your credentials and try again.",
        });
      }
    }

    // Step 3: Set session and cookies
    const sessionData = createSessionData(user, token);
    logger.info("Saving session data..."+JSON.stringify(sessionData));
    await saveSession(req, sessionData);

    logger.info("Setting cookies for the user...");
    res.cookie("userId", sessionData.id, {
      httpOnly: false,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });
    const cookieSafeData = {
      id: sessionData.id,
      userName: sessionData.userName,
      name: sessionData.name,
      email: sessionData.email
      // Token is deliberately omitted here
    };
    res.cookie("user", cookieSafeData);
    logger.info("Authentication process completed successfully for username: " + username);
    res.status(200).send({
      status: 200,
      message: "User authenticated successfully",
      data: { ...cookieSafeData, clientIp: getClientIp(req) },
    });
  } catch (error: any) {
    logger.error("Authentication error: " + error.message);
    res.status(500).send({ status: 500, message: "Internal server error", error });
  }
};

export const logout = (req: any, res: any) => {
  req.session.destroy(async (err: any) => {
    if (err) {
      return res
        .status(500)
        .send({ status: 500, message: "Internal server error" });
    }
    try {
      res.clearCookie("user");
      res.clearCookie("uid");
      res.clearCookie("name");
      res.clearCookie("sid");
      res
        .status(200)
        .send({ status: 200, message: "User logged out successfully" });
    } catch (error) {
      res.status(500).send({
        status: 500,
        message: "Failed to delete session from database",
      });
    }
  });
};

export const getCurrentUserSession = async (req: any, res: any) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    logger.warn("User ID not provided in request for session fetch.");
    return res.status(400).send({ status: 400, message: "Bad Request: User ID is required." });
  }

  try {
    const result = await pool.query('SELECT sess FROM sessions WHERE user_id = $1', [userId]);
    if (result.rows.length > 0) {
      const userSessionData = result.rows[0].sess.user;
      // Remove token before sending to client
      if( userSessionData.token ) {
        delete userSessionData.token;
      }
      logger.info(`Found active session for user: ${userSessionData.userName} `);
      res.status(200).send({ status: 200, data: { ...userSessionData, clientIp: getClientIp(req) } });
    } else {
      logger.warn(`No active session found for user ID: ${userId}`);
      res.status(401).send({ status: 401, message: "Unauthorized: No active session" });
    }
  } catch (error) {
    logger.error(`Error fetching user session from DB for user ID ${userId}:`+ error);
    res.status(500).send({ status: 500, message: "Internal Server Error" });
  }
};
