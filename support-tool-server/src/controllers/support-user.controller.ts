import { Request, Response } from "express";
import pool from "../config/database";
import { RequestHandler } from "express";

// 🚀 **Insert User into DB**
export const createSupportUser: RequestHandler = async (req: any, res: any) => {
  try {
    const { userId, userName, firstName, lastName, roles } = req.body;
console.log("🚀 Creating user with data:", req.body);
    if (!userId || !userName || !firstName || !lastName || !roles) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const result = await pool.query(
      `INSERT INTO users ("userId", "userName", "firstName", "lastName", roles) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, userName, firstName, lastName, `{${roles}}`]
    );

    res
      .status(201)
      .json({ status: 201, message: "User created!", user: result.rows[0] });
  } catch (error: any) {
    console.error("❌ Error inserting user:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 🚀 **Update User in DB**
export const updateSupportUser: RequestHandler = async (req: any, res: any) => {
  try {
    const { userId, userName, firstName, lastName, roles } = req.body;

    if (!userId || !userName || !firstName || !lastName || !roles) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const result = await pool.query(
      `UPDATE users SET "userName" = $2, "firstName" = $3, "lastName" = $4, roles = $5 WHERE "userId" = $1 RETURNING *`,
      [userId, userName, firstName, lastName, `{${roles}}`]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res
      .status(200)
      .json({ status: 200, message: "User updated!", user: result.rows[0] });
  } catch (error: any) {
    console.error("❌ Error updating user:", error);
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
    const result = await pool.query("SELECT * FROM users;");
    res.json(result.rows);
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