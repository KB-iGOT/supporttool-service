import express from "express";
import {
  getAuditLogs,
//   getAuditLogById,
  getAuditLogModules,
  getAuditLogActions,
  exportAuditLogs,
} from "./../controllers/audit-logs.controller";
import { userSession } from "../helpers/authHelper";

const auditLogsRoutes = express.Router();

// Define routes
auditLogsRoutes.route("/")
  .get(userSession, getAuditLogs);

auditLogsRoutes.route("/export")
  .get(userSession, exportAuditLogs);

// auditLogsRoutes.route("/:id")
//   .get(userSession, (req, res, next) => {
//     getAuditLogById(req, res).catch(next);
//   });

auditLogsRoutes.route("/modules")
  .get(userSession, getAuditLogModules);

auditLogsRoutes.route("/actions")
  .get(userSession, getAuditLogActions);

export default auditLogsRoutes;
