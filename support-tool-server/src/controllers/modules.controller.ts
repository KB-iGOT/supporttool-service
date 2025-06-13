import { Request, Response } from "express";
import pool from "../config/database";
import { RequestHandler } from "express";

// 🚀 **Insert module into DB**
export const createModule: RequestHandler = async (req: any, res: any) => {
  try {
    const { name, url, isVisible, isAdminModule, isRootModule } = req.body;

    if (!name || !url ) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const result = await pool.query(
      `INSERT INTO modules ("name", "url", "isVisible", "isAdminModule", "isRootModule")
             VALUES ($1, $2, $3, $4, $5) RETURNING *`, 
      [name, url, isVisible,  isAdminModule, isRootModule]
    );

    res
      .status(201)
      .json({ status: 201, message: "modules created!", user: result.rows[0] });
  } catch (error: any) {
    console.error("❌ Error inserting module:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 🚀 **Update module in DB**
export const updateModule: RequestHandler = async (req: any, res: any) => {
  try {
    const { id, name, url, isVisible, roles, isAdminModule, isRootModule } = req.body;

    if (!name || !url || !roles) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const result = await pool.query(
      `UPDATE modules SET "name" = $2, "url" = $3, "isVisible" = $4, "roles" = $5, "isAdminModule" = $6, "isRootModule" = $7 WHERE "id" = $1 RETURNING *`,
      [id, name, url, isVisible, roles, isAdminModule, isRootModule]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "module not found!" });
    }

    res
      .status(200)
      .json({ status: 200, message: "module updated!", user: result.rows[0] });
  } catch (error: any) {
    console.error("❌ Error updating module:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// 🚀 **Get All Users**
export const getModules: RequestHandler = async (
  _: Request,
  res: Response
) => {
  try {
    const result = await pool.query("SELECT * FROM modules;");
    res.json(result.rows);
  } catch (error: any) {
    console.error("❌ Error fetching modules:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const deleteModule: RequestHandler = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM modules WHERE "id" = $1`, [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Module not found!" });
    }

    res.status(200).json({ status: 204, message: "Module deleted!" });
  } catch (error: any) {
    console.error("❌ Error deleting module:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
