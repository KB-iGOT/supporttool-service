import { Request, Response } from "express";
import pool from "../config/database";
import logger from "../utils/logger";

interface AuditLogFilters {
  module?: string;
  subModule?: string;
  action?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  entityId?: string;
  userId?: string;
}

// Get audit logs with filters and pagination
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      module,
      subModule,
      action,
      status,
      dateFrom,
      dateTo,
      entityId,
      userId,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    // Build dynamic WHERE clause
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (module) {
      conditions.push(`module ILIKE $${paramIndex}`);
      values.push(`%${module}%`);
      paramIndex++;
    }

    if (subModule) {
      conditions.push(`sub_module ILIKE $${paramIndex}`);
      values.push(`%${subModule}%`);
      paramIndex++;
    }

    if (action) {
      conditions.push(`action ILIKE $${paramIndex}`);
      values.push(`%${action}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status ILIKE $${paramIndex}`);
      values.push(`%${status}%`);
      paramIndex++;
    }

    if (entityId) {
      conditions.push(`entity_id ILIKE $${paramIndex}`);
      values.push(`%${entityId}%`);
      paramIndex++;
    }

    if (userId) {
      conditions.push(`user_id ILIKE $${paramIndex}`);
      values.push(`%${userId}%`);
      paramIndex++;
    }

    if (dateFrom) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(dateTo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM audit_logs 
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    const dataQuery = `
      SELECT 
        id,
        user_id,
        module,
        sub_module,
        action,
        entity_id,
        request_payload,
        modified_payload,
        response_payload,
        ip_address,
        user_agent,
        status,
        message,
        created_at,
        jira_link
      FROM audit_logs 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(Number(limit), offset);
    
    const dataResult = await pool.query(dataQuery, values);

    // Transform the data to match the frontend interface
    const auditLogs = dataResult.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      module: row.module,
      subModule: row.sub_module,
      action: row.action,
      entityId: row.entity_id,
      requestPayload: row.request_payload,
      modifiedPayload: row.modified_payload,
      responsePayload: row.response_payload,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      status: row.status,
      message: row.message,
      createdAt: row.created_at,
      jiraLink: row.jira_link,
    }));

    res.status(200).json({
      data: auditLogs,
      total,
      page: Number(page),
      limit: Number(limit),
    });

  } catch (error) {
    logger.error(`Error fetching audit logs: ${error}`);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch audit logs",
    });
  }
};

// Get audit log by ID
export const getAuditLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
console.log(id,'===-=-=-=-=-=-=-=-=-=-=-')
    const query = `
      SELECT 
        id,
        user_id,
        module,
        sub_module,
        action,
        entity_id,
        request_payload,
        modified_payload,
        response_payload,
        ip_address,
        user_agent,
        status,
        message,
        created_at,
        jira_link
      FROM audit_logs 
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    console.log(result,'============audir');
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not found",
        message: "Audit log not found",
      });
    }

    const row = result.rows[0];
    const auditLog = {
      id: row.id,
      userId: row.user_id,
      module: row.module,
      subModule: row.sub_module,
      action: row.action,
      entityId: row.entity_id,
      requestPayload: row.request_payload,
      modifiedPayload: row.modified_payload,
      responsePayload: row.response_payload,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      status: row.status,
      message: row.message,
      createdAt: row.created_at,
      jiraLink: row.jira_link,
    };

    res.status(200).json({
      data: auditLog,
    });

  } catch (error) {
    logger.error(`Error fetching audit log by ID: ${error}`);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch audit log",
    });
  }
};

// Get distinct modules for filter dropdown
export const getAuditLogModules = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT DISTINCT module 
      FROM audit_logs 
      WHERE module IS NOT NULL 
      ORDER BY module
    `;

    console.log('==================')
    const result = await pool.query(query);
    console.log(result,'==================')
    const modules = result.rows.map(row => row.module);

    console.log(modules,'==================modules')
    res.status(200).json({
      data: modules,
    });

  } catch (error) {
    logger.error(`Error fetching audit log modules: ${error}`);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch modules",
    });
  }
};

// Get distinct actions for filter dropdown
export const getAuditLogActions = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT DISTINCT action 
      FROM audit_logs 
      WHERE action IS NOT NULL 
      ORDER BY action
    `;

    const result = await pool.query(query);
    const actions = result.rows.map(row => row.action);

    res.status(200).json({
      data: actions,
    });

  } catch (error) {
    logger.error(`Error fetching audit log actions: ${error}`);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch actions",
    });
  }
};

// Helper function to create audit log entry
export const createAuditLog = async (
  userId: string,
  module: string,
  subModule: string,
  action: string,
  entityId: string,
  requestPayload: any,
  modifiedPayload: any,
  responsePayload: any,
  ipAddress: string,
  userAgent: string,
  status: string,
  message?: string,
  jiraLink?: string
) => {
  try {
    const query = `
      INSERT INTO audit_logs (
        user_id,
        module,
        sub_module,
        action,
        entity_id,
        request_payload,
        modified_payload,
        response_payload,
        ip_address,
        user_agent,
        status,
        message,
        jira_link,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING id
    `;

    const values = [
      userId,
      module,
      subModule,
      action,
      entityId,
      JSON.stringify(requestPayload),
      JSON.stringify(modifiedPayload),
      JSON.stringify(responsePayload),
      ipAddress,
      userAgent,
      status,
      message,
      jiraLink,
    ];

    const result = await pool.query(query, values);
    return result.rows[0].id;

  } catch (error) {
    logger.error(`Error creating audit log: ${error}`);
    throw error;
  }
};
