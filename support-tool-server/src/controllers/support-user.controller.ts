import { Request, Response } from "express";
import pool from "../config/database";
import { RequestHandler } from "express";

// 🚀 **Insert User into DB**
export const createSupportUser: RequestHandler = async (req: any, res: any) => {
  try {
    const { userName, firstName, lastName, roles, email,userId } = req.body;
    console.log("🚀 Creating user with data:", req.body);
    
    if (!email || !firstName || !userName || !roles || !userId) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert user without userId (let database generate it)
      const userResult = await client.query(
        `INSERT INTO users ("id","userId","userName", "firstName", "lastName", "email") 
         VALUES ($1, $1, $2, $3, $4, $5) RETURNING *`,
        [userId, userName, firstName, lastName, email]
      );
      
      const createdUser = userResult.rows[0];
      console.log("🚀 Created user:", createdUser);
      const generatedUserId = createdUser.id; // Get the database-generated ID
      
      console.log("🚀 Generated userId:", generatedUserId);
      
      // Insert role assignments with array syntax
      const roleArray = Array.isArray(roles) ? roles : [roles];
      await client.query(
        `INSERT INTO user_roles(user_id, role_ids) VALUES ($1, $2)`,
        [generatedUserId, roleArray]
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({ 
        status: 201, 
        message: "User created with roles!", 
        user: createdUser 
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("❌ Error inserting user or roles:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 🚀 **Update User Roles in DB**
export const updateSupportUser: RequestHandler = async (req: any, res: any) => {
  try {
    const { userId, roles } = req.body;

    if (!userId || !roles) {
      return res.status(400).json({ message: "Required fields are missing! User ID and roles are required." });
    }

    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // First, verify the user exists
      const userResult = await client.query(
        `SELECT * FROM users WHERE "userId" = $1`,
        [userId]
      );

      if (userResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: "User not found!" });
      }
      
      const user = userResult.rows[0];
      const dbUserId = user.id; // Get the database ID (not userId)
      
      // Next, handle roles - first check if user already has role assignments
      const existingRoles = await client.query(
        `SELECT * FROM user_roles WHERE user_id = $1`,
        [dbUserId]
      );
      
      // Prepare roles array
      const roleArray = Array.isArray(roles) ? roles : [roles];
      
      if ((existingRoles.rowCount ?? 0) > 0) {
        // Update existing role assignment
        await client.query(
          `UPDATE user_roles SET role_ids = $2 WHERE user_id = $1`,
          [dbUserId, roleArray]
        );
      } else {
        // Create new role assignment
        await client.query(
          `INSERT INTO user_roles(user_id, role_ids) VALUES ($1, $2)`,
          [dbUserId, roleArray]
        );
      }
      
      // Get the updated roles for the response
      const userRoles = await client.query(
        `SELECT 
          r.id AS role_id,
          r.name AS role_name
        FROM 
          roles r
        WHERE 
          r.id = ANY(
            SELECT unnest(role_ids) 
            FROM user_roles 
            WHERE user_id = $1
          )`,
        [dbUserId]
      );
      
      // Add roles to the user object
      user.roles = userRoles.rows;
      
      await client.query('COMMIT');
      
      res.status(200).json({ 
        status: 200, 
        message: "User roles updated successfully!", 
        user: user 
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("❌ Error updating user roles:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 🚀 **Get All Users**
export const getSupportUsers: RequestHandler = async (
  _: Request,
  res: Response
) => {
  try {
    // Get all users
    const usersResult = await pool.query("SELECT * FROM users");
    const users = usersResult.rows;
    
    // If we have users, get their roles
    if (users && users.length > 0) {
      // Process each user to add their roles
      for (let i = 0; i < users.length; i++) {
        const userId = users[i].id;
        
        // Get roles for this user
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
              WHERE user_id = $1
            )`,
          [userId]
        );
        
        // Add roles to user object
        users[i].roles = userRoles.rows.length ? userRoles.rows : [];
      }
    }
    
    res.json(users);
  } catch (error: any) {
    console.error("❌ Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const deleteSupportUser: RequestHandler = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM users WHERE "userId" = $1`, [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json({ status: 204, message: "User deleted!" });
  } catch (error: any) {
    console.error("❌ Error deleting user:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};