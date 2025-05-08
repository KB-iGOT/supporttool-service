import request from "request";
import pool from "../config/database";
import logger from "../utils/logger";

export const authenticateKeycloakUser = (req: any, res: any) => {
  const { username, password } = req.body;
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
  try {
    request(options, async function (error, response) {
      if (error) throw new Error(error);
      const users: any = await pool.query(
        'SELECT * FROM users WHERE "userName" = $1',
        [username]
      );
      if (users.rows.length === 0) {
        res.status(401).send({ message: "Invalid username or password" });
        return;
      }

      if (!users.rows[0]?.userId) {
        res.status(500).send({
          status: 500,
          message: "User ID is missing in the database record",
        });
        return;
      }
      
      const sessionData = {
        id: users.rows[0].userId,
        userName: username,
        name:
          users.rows[0].firstName +
          (users.rows[0].lastName ? " " + users.rows[0].lastName : ""),
        token: JSON.parse(response.body).access_token,
        roles: users.rows[0].roles,
      };

      req.session.user = sessionData;
      req.session.save((err: any) => {
        logger.error("Session error: " + JSON.stringify(err));
        if (err) return res.status(500).send({message: "Session save failed", err});
        res.cookie('userId', req.session.user.id, {
          httpOnly: false,       
          secure: false,        
          maxAge: 24 * 60 * 60 * 1000, 
          sameSite: 'lax', 
        });
        logger.info("Session data: " + JSON.stringify(sessionData));
        res.cookie("user",sessionData);

        res.status(200).send({
          status: 200,
          message: "User authenticated successfully",
          userId: users.rows[0].userId,
        });
      });
    });
  } catch (er) {
    res.status(500).send({ status: 500, message: "Internal server error" });
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
