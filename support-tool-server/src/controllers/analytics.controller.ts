import { Request, Response } from "express";
import pool from "../config/database";
import logger from "../utils/logger";

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


// 📊 **Get Analytics Statistics**
export const getAnalyticsStats = async (req: Request, res: Response) => {
  try {
    const timeRange = req.query.timeRange as string;
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;
    
    let startDate: Date;
    let endDate: Date = new Date(); // Default to current date
    
    // Handle custom date range or preset time range
    if (startDateParam && endDateParam) {
      // Custom date range
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      // Set endDate to end of day for inclusivity
      endDate.setHours(23, 59, 59, 999);
      console.log('Using custom date range:', { startDate, endDate });
    } else {
      // Preset time range
      const timeRangeValue = timeRange || '30d';
      let daysBack = 30;
      
      switch (timeRangeValue) {
        case '30d':
          daysBack = 30;
          break;
        case '60d':
          daysBack = 60;
          break;
        case '90d':
          daysBack = 90;
          break;
        case '6m':
          daysBack = 180; // 6 months ≈ 180 days
          break;
        case '1y':
          daysBack = 365; // 1 year
          break;
        case '7d':
          daysBack = 7;
          break;
        default:
          daysBack = 30;
      }
      
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      console.log('Using preset range:', timeRangeValue, { startDate, endDate });
    }

    // Get total users within date range
    const totalUsersQuery = `
      SELECT COUNT(*) as count FROM users
      WHERE "createdAt" >= $1 AND "createdAt" <= $2
    `;
    const totalUsersResult = await pool.query(totalUsersQuery, [startDate, endDate]);
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Get total modules (distinct modules from audit logs within date range)
    const totalModulesQuery = `
      SELECT COUNT(DISTINCT module) as count FROM audit_logs
      WHERE created_at >= $1 AND created_at <= $2
    `;
    const totalModulesResult = await pool.query(totalModulesQuery, [startDate, endDate]);
    const totalModules = parseInt(totalModulesResult.rows[0].count);

    // Get recent audit logs count
    const recentAuditLogsQuery = `
      SELECT COUNT(*) as count FROM audit_logs 
      WHERE created_at >= $1 AND created_at <= $2
    `;
    const recentAuditLogsResult = await pool.query(recentAuditLogsQuery, [startDate, endDate]);
    const recentAuditLogs = parseInt(recentAuditLogsResult.rows[0].count);

    // Get failed operations count
    const failedOperationsQuery = `
      SELECT COUNT(*) as count FROM audit_logs 
      WHERE status IN ('FAILURE', 'ERROR') AND created_at >= $1 AND created_at <= $2
    `;
    const failedOperationsResult = await pool.query(failedOperationsQuery, [startDate, endDate]);
    const failedOperations = parseInt(failedOperationsResult.rows[0].count);

    // Get successful operations count
    const successfulOperationsQuery = `
      SELECT COUNT(*) as count FROM audit_logs 
      WHERE status = 'SUCCESS' AND created_at >= $1 AND created_at <= $2
    `;
    const successfulOperationsResult = await pool.query(successfulOperationsQuery, [startDate, endDate]);
    const successfulOperations = parseInt(successfulOperationsResult.rows[0].count);

    // Get user growth over time
    const userGrowthQuery = `
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM users 
      WHERE "createdAt" >= $1 AND "createdAt" <= $2
      GROUP BY DATE("createdAt")
      ORDER BY date
    `;
    const userGrowthResult = await pool.query(userGrowthQuery, [startDate, endDate]);
    const userGrowth = userGrowthResult.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count)
    }));

    // Get audit logs by module
    const auditLogsByModuleQuery = `
      SELECT 
        module,
        COUNT(*) as count
      FROM audit_logs 
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY module
      ORDER BY count DESC
      LIMIT 10
    `;
    const auditLogsByModuleResult = await pool.query(auditLogsByModuleQuery, [startDate, endDate]);
    const auditLogsByModule = auditLogsByModuleResult.rows.map(row => ({
      module: row.module,
      count: parseInt(row.count)
    }));

    // Get audit logs by action
    const auditLogsByActionQuery = `
      SELECT 
        action,
        COUNT(*) as count
      FROM audit_logs 
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;
    const auditLogsByActionResult = await pool.query(auditLogsByActionQuery, [startDate, endDate]);
    const auditLogsByAction = auditLogsByActionResult.rows.map(row => ({
      action: row.action,
      count: parseInt(row.count)
    }));

    // Get audit logs by status
    const auditLogsByStatusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM audit_logs 
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY status
      ORDER BY count DESC
    `;
    const auditLogsByStatusResult = await pool.query(auditLogsByStatusQuery, [startDate, endDate]);
    const auditLogsByStatus = auditLogsByStatusResult.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count)
    }));

    // Get audit logs timeline (success vs failure over time)
    const auditLogsTimelineQuery = `
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status IN ('FAILURE', 'ERROR') THEN 1 ELSE 0 END) as failure
      FROM audit_logs 
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    const auditLogsTimelineResult = await pool.query(auditLogsTimelineQuery, [startDate, endDate]);
    const auditLogsTimeline = auditLogsTimelineResult.rows.map(row => ({
      date: row.date,
      success: parseInt(row.success),
      failure: parseInt(row.failure)
    }));

    // Get module activity (module + sub_module combinations)
    const moduleActivityQuery = `
      SELECT 
        module,
        sub_module,
        COUNT(*) as count
      FROM audit_logs 
      WHERE created_at >= $1 AND created_at <= $2 AND sub_module IS NOT NULL
      GROUP BY module, sub_module
      ORDER BY count DESC
      LIMIT 15
    `;
    const moduleActivityResult = await pool.query(moduleActivityQuery, [startDate, endDate]);
    const moduleActivity = moduleActivityResult.rows.map(row => ({
      module: row.module,
      subModule: row.sub_module,
      count: parseInt(row.count)
    }));

    const dashboardStats = {
      totalUsers,
      totalModules,
      recentAuditLogs,
      failedOperations,
      successfulOperations,
      userGrowth,
      auditLogsByModule,
      auditLogsByAction,
      auditLogsByStatus,
      auditLogsTimeline,
      moduleActivity
    };

    res.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    logger.error(`Error fetching dashboard stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// 📈 **Get User Growth Data**
export const getUserGrowth = async (req: Request, res: Response) => {
  try {
    const timeRange = req.query.timeRange as string;
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;
    
    let startDate: Date;
    let endDate: Date = new Date();
    
    // Handle custom date range or preset time range
    if (startDateParam && endDateParam) {
      // Custom date range
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      // Preset time range
      const timeRangeValue = timeRange || '30d';
      let daysBack = 30;
      
      switch (timeRangeValue) {
        case '30d':
          daysBack = 30;
          break;
        case '60d':
          daysBack = 60;
          break;
        case '90d':
          daysBack = 90;
          break;
        case '6m':
          daysBack = 180;
          break;
        case '1y':
          daysBack = 365;
          break;
        case '7d':
          daysBack = 7;
          break;
        default:
          daysBack = 30;
      }
      
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
    }

    const query = `
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM users 
      WHERE "createdAt" >= $1 AND "createdAt" <= $2
      GROUP BY DATE("createdAt")
      ORDER BY date
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    const userGrowth = result.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count)
    }));

    res.json({
      success: true,
      data: userGrowth
    });

  } catch (error) {
    logger.error(`Error fetching user growth: ${error instanceof Error ? error.message : 'Unknown error'}`);
    res.status(500).json({
      success: false,
      message: 'Error fetching user growth data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};