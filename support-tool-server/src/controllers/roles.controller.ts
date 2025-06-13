// Backend controller for role management
import { Request, Response } from "express";
import { RequestHandler } from "express";
import pool from "../config/database";

// Get all roles
export const getAllRoles: RequestHandler = async (_: Request, res: Response) => {
  try {
    console.log("🔍 Fetching all roles...");
    const result = await pool.query("SELECT * FROM roles ORDER BY name ASC");
    res.json({
      status: 200,
      responseCode: "OK",
      roles: result.rows,
    });
  } catch (error: any) {
    console.error("❌ Error fetching roles:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Create a new role
export const createRole: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    console.log("🔍 Creating role with name:", name);
    
    if (!name || typeof name !== 'string') {
      res.status(400).json({ message: "Valid role name is required" });
      return;
    }
    
    const normalizedName = name.trim();
    
    // Check if role name already exists
    const existingRole = await pool.query(
      "SELECT * FROM roles WHERE name = $1",
      [normalizedName]
    );
    
    if (existingRole && existingRole.rowCount && existingRole.rowCount > 0) {
      res.status(409).json({ message: "Role with this name already exists" });
      return;
    }
    
    // Insert the new role
    const result = await pool.query(
      "INSERT INTO roles (name) VALUES ($1) RETURNING *",
      [normalizedName]
    );
    
    console.log("✅ Role created successfully:", result.rows[0]);
    
    // Return success response with the created role
    res.status(201).json({
      status: 201,
      responseCode: "Created",
      role: result.rows[0],
      message: "Role created successfully"
    });
  } catch (error: any) {
    console.error("❌ Error creating role:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update a role
export const updateRole: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    console.log(`🔍 Updating role with id: ${id}, new name: ${name}`);
    
    if (!name || typeof name !== 'string') {
      res.status(400).json({ message: "Valid role name is required" });
      return;
    }
    
    const normalizedName = name.trim();
    
    // Check if role exists
    const existingRole = await pool.query(
      "SELECT * FROM roles WHERE id = $1",
      [id]
    );
    
    if (existingRole.rowCount === 0) {
      console.log(`❌ Role not found with id: ${id}`);
      res.status(404).json({ message: "Role not found" });
      return;
    }
    
    // Check if new name would cause a conflict
    const nameConflict = await pool.query(
      "SELECT * FROM roles WHERE name = $1 AND id != $2",
      [normalizedName, id]
    );
    
    if (nameConflict.rowCount && nameConflict.rowCount > 0) {
      console.log(`❌ Name conflict: "${normalizedName}" already exists for another role`);
      res.status(409).json({ message: "Another role with this name already exists" });
      return;
    }
    
    // Update the role
    const result = await pool.query(
      "UPDATE roles SET name = $1 WHERE id = $2 RETURNING *",
      [normalizedName, id]
    );
    
    console.log("✅ Role updated successfully:", result.rows[0]);
    
    res.json({
      status: 200,
      responseCode: "OK",
      role: result.rows[0],
      message: "Role updated successfully"
    });
  } catch (error: any) {
    console.error("❌ Error updating role:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
// // Delete a role
// export const deleteRole: RequestHandler = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
    
//     // Check if role exists
//     const existingRole = await pool.query(
//       "SELECT * FROM roles WHERE id = $1",
//       [id]
//     );
    
//     if (existingRole.rowCount === 0) {
//       return res.status(404).json({ message: "Role not found" });
//     }
    
//     // Delete the role (permissions will cascade due to foreign key constraint)
//     await pool.query("DELETE FROM roles WHERE id = $1", [id]);
    
//     res.json({
//       status: 200,
//       responseCode: "OK",
//       message: "Role deleted successfully",
//     });
//   } catch (error: any) {
//     console.error("❌ Error deleting role:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// Get permissions for a role
// export const getRolePermissions: RequestHandler = async (req: Request, res: Response) => {
//   try {
//     const { roleId } = req.params;
    
//     // Check if role exists
//     const existingRole = await pool.query(
//       "SELECT * FROM roles WHERE id = $1",
//       [roleId]
//     );
    
//     if (existingRole.rowCount === 0) {
//       res.status(404).json({ message: "Role not found" });
//       return;
//     }
    
//     // Get permissions
//     const permissions = await pool.query(
//       "SELECT * FROM role_permissions WHERE role_id = $1",
//       [roleId]
//     );
    
//     res.json({
//       status: 200,
//       responseCode: "OK",
//       permissions: permissions.rows,
//     });
//   } catch (error: any) {
//     console.error("❌ Error fetching role permissions:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };


export const getRolePermissions: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    
    // Check if role exists
    const existingRole = await pool.query(
      "SELECT * FROM roles WHERE id = $1",
      [roleId]
    );
    
    if (existingRole.rowCount === 0) {
      res.status(404).json({ message: "Role not found" });
      return;
    }
    
    // Get permissions with module names
    const permissions = await pool.query(
      `SELECT rp.*, m.name as module_name 
       FROM role_permissions rp
       JOIN modules m ON rp.module_id = m.id
       WHERE rp.role_id = $1`,
      [roleId]
    );
    
    // Get role name
    const role = existingRole.rows[0];
    
    res.json({
      status: 200,
      responseCode: "OK",
      role: {
        id: roleId,
        name: role.name
      },
      permissions: permissions.rows,
    });
  } catch (error: any) {
    console.error("❌ Error fetching role permissions:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update permissions for a role
export const updateRolePermissions: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) {
      res.status(400).json({ message: "Permissions must be an array" });
      return;
    }
    
    // Check if role exists
    const existingRole = await pool.query(
      "SELECT * FROM roles WHERE id = $1",
      [roleId]
    );
    
    if (existingRole.rowCount === 0) {
      res.status(404).json({ message: "Role not found" });
      return;
    }
    
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete existing permissions for this role
      await client.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);
      
      // Insert new permissions
      for (const permission of permissions) {
        await client.query(
          `INSERT INTO role_permissions 
          (role_id, module_id, can_read, can_write, can_delete) 
          VALUES ($1, $2, $3, $4, $5)`,
          [
            roleId, 
            permission.module_id,
            permission.can_read,
            permission.can_write,
            permission.can_delete
          ]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({
        status: 200,
        responseCode: "OK",
        message: "Permissions updated successfully",
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("❌ Error updating role permissions:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};