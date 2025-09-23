import { Request, Response } from "express";
import pool from "../config/database";
import { RequestHandler } from "express";

// Extend the Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user: {
        id: number;
        [key: string]: any;
      };
    }
  }
}

// 🚀 **Get All Modules**
export const getAllModules: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = req.user.user_id;
      console.log("Fetching modules for user ID:", userId);
      // First get user roles
      const userRolesResult = await pool.query(
        'SELECT role_ids FROM user_roles WHERE user_id = $1',
        [userId]
      );
      console.log("User roles result:", userRolesResult.rows);
      if (!userRolesResult.rows.length) {
        res.status(403).json({ 
          status: 403,
          responseCode: "FORBIDDEN",
          message: "User has no assigned roles" 
        });
        return;
      }
      
      const roleIds = userRolesResult.rows[0].role_ids;
      console.log("User roles result:", roleIds);
      
      // Get modules with permissions for user's roles
      const permittedModulesQuery = `
        SELECT DISTINCT m.* 
        FROM modules m
        JOIN role_permissions rp ON m.id = rp.module_id
        WHERE rp.role_id = ANY($1::int[])
        AND m."isVisible" = true
        AND rp.can_read = true
      `;
      
      // Get regular user modules
      const userModules = await pool.query(
        `${permittedModulesQuery} AND m."isRootModule" = true ORDER BY m."name" ASC`,
        [roleIds]
      );
      
      // Get admin modules
      const adminModules = await pool.query(
        `${permittedModulesQuery} AND m."isAdminModule" = true ORDER BY m."name" ASC`,
        [roleIds]
      );
      
      res.json({
        "status": 200, 
        "responseCode": "OK",
        "modules": userModules.rows,
        "adminModules": adminModules.rows
      });
    } catch (error: any) {
      console.error("❌ Error fetching modules:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  };

  // 🚀 **Get All Sub Modules for a Root Module**
export const getSubModules: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.user_id;
    const { root } = req.query; // root module name from query param

    if (!root) {
      res.status(400).json({ message: "Root module name is required." });
      return;
    }

    // First get user roles
    const userRolesResult = await pool.query(
      'SELECT role_ids FROM user_roles WHERE user_id = $1',
      [userId]
    );

    if (!userRolesResult.rows.length) {
      res.status(403).json({ 
        status: 403,
        responseCode: "FORBIDDEN",
        message: "User has no assigned roles" 
      });
      return;
    }
    
    const roleIds = userRolesResult.rows[0].role_ids;

    // Get sub-modules with permissions for user's roles, filtered by root module
    const subModulesQuery = `
      SELECT DISTINCT m.* 
      FROM modules m
      JOIN role_permissions rp ON m.id = rp.module_id
      WHERE rp.role_id = ANY($1::int[])
      AND m."isVisible" = true
      AND rp.can_read = true
      AND m."isRootModule" = false
      AND m."isAdminModule" = false
      AND m.url LIKE $2
      ORDER BY m.name ASC
    `;
    
    const subModules = await pool.query(subModulesQuery, [roleIds, `/${root}/%`]);
    
    res.json(subModules.rows);
  } catch (error: any) {
    console.error("❌ Error fetching sub-modules:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
