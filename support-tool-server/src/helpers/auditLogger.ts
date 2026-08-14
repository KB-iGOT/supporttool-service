import axios from "axios";
import pool from "../config/database";

interface LogAuditParams {
  user_id: number | string|any;
  module: number | string|any;
  sub_module?: number | string | null;
  action?: number | string;
  // Express 5 types route params as `string | string[]`, so callers passing
  // req.params/req.headers values land here as arrays in the type system.
  entity_id?: number | string | string[];
  request_payload?: any;
  modified_payload?: any;
  response_payload?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  status?: string;
  message?: string;
  jira_link?: string|any;
}

const logAudit = async({
  user_id,
  module,
  sub_module = null,
  action,
  entity_id,
  request_payload = null,
  modified_payload = null,
  response_payload,
  ip_address = null,
  user_agent = null,
  status,
  message,
  jira_link,
}: LogAuditParams) => {
  await pool.query(
    `INSERT INTO audit_logs (user_id,
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
  jira_link)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      user_id,
      module,
      sub_module,
      action,
      Array.isArray(entity_id) ? entity_id.join(",") : entity_id,
      JSON.stringify(request_payload),
      JSON.stringify(modified_payload),
      JSON.stringify(response_payload),
      ip_address,
      user_agent,
      status,
      message,
      jira_link,
    ]
  );
}

export default logAudit;