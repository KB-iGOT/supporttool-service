import { Request, Response } from "express";
import pool from "../config/database";
import { RequestHandler } from "express";

// 🚀 **Get All Users**
export const getAdminModules: RequestHandler = async (
    _: Request,
    res: Response
  ) => {
    try {
    const userModules = await pool.query("SELECT * FROM modules WHERE \"isRootModule\"=true AND \"isVisible\"=true ORDER BY \"name\" ASC");
      const adminModules = await pool.query("SELECT * FROM modules WHERE \"isAdminModule\"=true AND \"isVisible\"=true ORDER BY \"name\" ASC");
        console.log({
            "status": 200, "responseCode": "OK",
            "modules": userModules.rows,
            "adminModules": adminModules.rows
          });
      res.json({
        "status": 200, "responseCode": "OK",
        "modules": userModules.rows,
        "adminModules": adminModules.rows
      });
    } catch (error: any) {
      console.error("❌ Error fetching users:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  };