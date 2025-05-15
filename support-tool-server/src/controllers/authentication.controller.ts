import request from "request";
import pool from "../config/database";
import logger from "../utils/logger";

const getUserFromDB = async (username: string) => {
  const users = await pool.query(
    'SELECT * FROM users WHERE "userName" = $1',
    [username]
  );
  return users.rows[0];
};

const authenticateWithKeycloak = (username: string, password: string) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      url: `${process.env.KONG_API_URL}auth/realms/sunbird/protocol/openid-connect/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      form: {
        client_id: process.env.KEYCLOAK_CLIENT_ID,
        password: password,
        grant_type: "password",
        username: username,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
      },
    };

    request(options, (error, response) => {
      if (error) {
        return reject(error);
      }
      const responseBody = JSON.parse(response.body);
      if (responseBody.error) {
        return reject(new Error(responseBody.error));
      }
      resolve(responseBody.access_token);
    });
  });
};

const createSessionData = (user: any, token: string) => {
  return {
    id: user.userId,
    userName: user.userName,
    name: user.firstName + (user.lastName ? " " + user.lastName : ""),
    token: token,
    roles: user.roles,
  };
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
    const token: any = await authenticateWithKeycloak(username, password);
    if (!token) {
      logger.warn("Authentication failed with Keycloak for username: " + username);
      return res.status(401).send({
        message: "Authentication failed with Keycloak. Please check your credentials.",
      });
    }
    logger.info("Authentication successful with Keycloak for username: " + username);

    // Step 3: Set session and cookies
    const sessionData = createSessionData(user, token);
    logger.info("Saving session data...");
    await saveSession(req, sessionData);

    logger.info("Setting cookies for the user...");
    res.cookie("userId", sessionData.id, {
      httpOnly: false,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });
    res.cookie("user", sessionData);

    logger.info("Authentication process completed successfully for username: " + username);
    res.status(200).send({
      status: 200,
      message: "User authenticated successfully",
      userId: sessionData.id,
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
