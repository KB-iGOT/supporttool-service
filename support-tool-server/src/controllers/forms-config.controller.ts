import { Response } from "express";
import { RequestHandler } from "express";
import axios from "axios";
import logger from "../utils/logger";
import logAudit from "../helpers/auditLogger";

const FORMS_CONFIG_LIST_PATH = "/api/formsConfig/v2/list";
const FORMS_CONFIG_READ_PATH = "/api/formsConfig/v2/admin/read";
const FORMS_CONFIG_UPDATE_PATH = "/api/formsConfig/v2/update";
const FORMS_CONFIG_CREATE_PATH = "/api/formsConfig/v2/create";

/** Required on create — the record cannot be looked up without them. */
const REQUIRED_CREATE_FIELDS = ["name", "type", "subType", "portal"] as const;

/** Top-level properties of a form config, in the order the update API expects them. */
const CONFIG_FIELDS = [
  "id",
  "name",
  "type",
  "subType",
  "portal",
  "criteria",
  "data",
  "clientVersion",
] as const;

/** Scalar-ish fields small enough to record in full (before and after) in the audit entry. */
const SUMMARY_FIELDS = ["name", "type", "subType", "portal", "clientVersion", "criteria"] as const;

/** Cap on enumerated `data` diff paths, so one wholesale replacement can't bloat an audit row. */
const MAX_DIFF_PATHS = 500;

// KONG_API_URL is configured with a trailing slash in some environments,
// strip it so the joined url never ends up with a duplicated separator.
const getKongBaseUrl = () => (process.env.KONG_API_URL || "").replace(/\/+$/, "");

// Create API headers
const createApiHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "accept": "*/*",
    "Authorization": process.env.AUTHORIZATION || "",
    "x-authenticated-user-token": token ? token.trim() : "",
  };

  return headers;
};

// Handle API errors
function handleApiError(error: any, res: Response, logMessage: string) {
  logger.error(`❌ ${logMessage}`);

  if (error.response) {
    logger.error(`API Error status: ${error.response.status}`);
    if (process.env.NODE_ENV !== 'production') {
      logger.error(`API Error details: ${JSON.stringify(error.response.data)}`);
    }

    res.status(error.response.status).json({
      responseCode: "API_ERROR",
      responseMessage: logMessage,
      error: error.response.data,
    });
  } else if (error.request) {
    logger.error("No response received from API");
    res.status(503).json({
      responseCode: "SERVICE_UNAVAILABLE",
      responseMessage: "No response received from API",
      error: "Service unavailable",
    });
  } else {
    logger.error(`Request setup error: ${error.message}`);
    res.status(500).json({
      responseCode: "SERVER_ERROR",
      responseMessage: "Internal server error",
      error: error.message,
    });
  }
}

/**
 * Flattens the difference between two values into a map of path -> { original, new }.
 * Only leaves that actually changed are emitted, so the result is a precise change list
 * rather than a copy of the document.
 */
const diffValues = (
  original: any,
  updated: any,
  path: string,
  changes: Record<string, any>
): void => {
  if (JSON.stringify(original) === JSON.stringify(updated)) return;

  const bothPlainObjects =
    original && updated &&
    typeof original === "object" && typeof updated === "object" &&
    !Array.isArray(original) && !Array.isArray(updated);

  if (bothPlainObjects) {
    const keys = new Set([...Object.keys(original), ...Object.keys(updated)]);
    keys.forEach((key) => {
      diffValues(original[key], updated[key], path ? `${path}.${key}` : key, changes);
    });
    return;
  }

  if (Array.isArray(original) && Array.isArray(updated)) {
    const maxLength = Math.max(original.length, updated.length);
    if (original.length !== updated.length) {
      changes[`${path}.length`] = { original: original.length, new: updated.length };
    }
    for (let i = 0; i < maxLength; i += 1) {
      diffValues(original[i], updated[i], `${path}[${i}]`, changes);
    }
    return;
  }

  // Leaf: a primitive, a type change, or an added/removed branch.
  changes[path || "root"] = { original, new: updated };
};

const buildChangeReport = (previous: any, next: any) => {
  const allChanges: Record<string, any> = {};
  CONFIG_FIELDS.forEach((field) => {
    if (field === "id") return;
    diffValues(previous?.[field], next?.[field], field, allChanges);
  });

  const paths = Object.keys(allChanges);
  const changedSections = Array.from(new Set(paths.map((p) => p.split(/[.[]/)[0])));

  // Full before/after for the small fields; path-level detail for the `data` blob.
  const fieldChanges: Record<string, any> = {};
  SUMMARY_FIELDS.forEach((field) => {
    if (JSON.stringify(previous?.[field]) !== JSON.stringify(next?.[field])) {
      fieldChanges[field] = { original: previous?.[field], new: next?.[field] };
    }
  });

  const dataPaths = paths.filter((p) => p === "data" || p.startsWith("data.") || p.startsWith("data["));
  const keptPaths = dataPaths.slice(0, MAX_DIFF_PATHS);
  const dataDetail: Record<string, any> = {};
  keptPaths.forEach((p) => {
    dataDetail[p] = allChanges[p];
  });

  return {
    changedSections,
    changeStats: {
      totalChanges: paths.length,
      added: paths.filter((p) => allChanges[p].original === undefined).length,
      modified: paths.filter(
        (p) => allChanges[p].original !== undefined && allChanges[p].new !== undefined
      ).length,
      removed: paths.filter((p) => allChanges[p].new === undefined).length,
    },
    fieldChanges,
    dataChanges: {
      totalPaths: dataPaths.length,
      truncated: dataPaths.length > keptPaths.length,
      omitted: dataPaths.length - keptPaths.length,
      paths: dataDetail,
    },
  };
};

// Get the complete forms config list.
// The upstream API returns every config in a single payload, so the response is
// proxied as-is and the client handles searching / paginating locally.
export const getFormsConfigList: RequestHandler = async (req: any, res: Response) => {
  logger.info("Fetching forms config list");

  try {
    const response = await axios({
      method: "GET",
      url: `${getKongBaseUrl()}${FORMS_CONFIG_LIST_PATH}`,
      headers: createApiHeaders(req.user?.token),
    });

    logger.info("Successfully retrieved forms config list");
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, "Error fetching forms config list");
  }
};

// Read a single form config (including its `data` blob) by id.
export const getFormsConfigById: RequestHandler = async (req: any, res: Response) => {
  const { id } = req.params;

  if (!id) {
    logger.warn("Form config id is required");
    res.status(400).json({
      responseCode: "BAD_REQUEST",
      responseMessage: "Form config id is required",
    });
    return;
  }

  logger.info(`Fetching forms config for id: ${id}`);

  try {
    const response = await axios({
      method: "GET",
      url: `${getKongBaseUrl()}${FORMS_CONFIG_READ_PATH}/${encodeURIComponent(String(id))}`,
      headers: createApiHeaders(req.user?.token),
    });

    logger.info(`Successfully retrieved forms config for id: ${id}`);
    res.status(200).json(response.data);
  } catch (error) {
    handleApiError(error, res, `Error fetching forms config for id: ${id}`);
  }
};

// Update a form config. The current version is read back first so the audit entry
// records an authoritative before/after diff rather than trusting the client.
export const updateFormsConfig: RequestHandler = async (req: any, res: Response) => {
  const { requestPayload, jiraLink, module } = req.body || {};
  const user_id = req.headers["x-user-id"];
  const id = requestPayload?.id;

  const auditBase = {
    user_id,
    module: module || "FORMS_CONFIG",
    sub_module: "UPDATE_FORM_CONFIG",
    action: "UPDATE",
    entity_id: id === undefined || id === null ? "" : String(id),
    jira_link: jiraLink || null,
  };

  if (!requestPayload || id === undefined || id === null || id === "") {
    const errorResponse = {
      responseCode: "BAD_REQUEST",
      responseMessage: "Form config id is required",
    };
    await logAudit({
      ...auditBase,
      request_payload: requestPayload || null,
      modified_payload: null,
      status: "FAILURE",
      response_payload: errorResponse,
      message: "Form config id is required",
    });
    res.status(400).json(errorResponse);
    return;
  }

  // Only forward the fields the update API accepts.
  const upstreamRequest: Record<string, any> = {};
  CONFIG_FIELDS.forEach((field) => {
    if (requestPayload[field] !== undefined) upstreamRequest[field] = requestPayload[field];
  });

  logger.info(`Updating forms config for id: ${id}`);

  // Read the current version so the diff reflects what is actually stored upstream.
  let previous: any = null;
  let previousError: string | null = null;
  try {
    const currentResponse = await axios({
      method: "GET",
      url: `${getKongBaseUrl()}${FORMS_CONFIG_READ_PATH}/${encodeURIComponent(String(id))}`,
      headers: createApiHeaders(req.user?.token),
    });
    previous = currentResponse.data?.result ?? null;
  } catch (error: any) {
    previousError = error?.message || "Unable to read the current configuration";
    logger.warn(`Could not read current forms config ${id} for audit diff: ${previousError}`);
  }

  const changeReport = previous
    ? buildChangeReport(previous, upstreamRequest)
    : { previousStateUnavailable: true, reason: previousError };

  try {
    const response = await axios({
      method: "PUT",
      url: `${getKongBaseUrl()}${FORMS_CONFIG_UPDATE_PATH}`,
      headers: createApiHeaders(req.user?.token),
      data: { request: upstreamRequest },
    });

    logger.info(`Successfully updated forms config for id: ${id}`);

    await logAudit({
      ...auditBase,
      request_payload: { request: upstreamRequest },
      modified_payload: changeReport,
      status: "SUCCESS",
      response_payload: response.data,
      message: `Updated form config "${upstreamRequest.name ?? id}"`,
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    const errorMessage = `Error updating forms config for id: ${id}`;
    logger.error(`❌ ${errorMessage}`);

    const responsePayload = axios.isAxiosError(error) && error.response
      ? { status: error.response.status, data: error.response.data }
      : { message: error?.message || "Unknown error" };

    await logAudit({
      ...auditBase,
      request_payload: { request: upstreamRequest },
      modified_payload: changeReport,
      status: "FAILURE",
      response_payload: responsePayload,
      message: errorMessage,
    });

    handleApiError(error, res, errorMessage);
  }
};

// Create a form config. There is no previous version to diff against, so the audit
// entry records the full submitted request plus a summary of what was created.
export const createFormsConfig: RequestHandler = async (req: any, res: Response) => {
  const { requestPayload, jiraLink, module } = req.body || {};
  const user_id = req.headers["x-user-id"];

  const auditBase = {
    user_id,
    module: module || "FORMS_CONFIG",
    sub_module: "CREATE_FORM_CONFIG",
    action: "CREATE",
    entity_id: requestPayload?.name ? String(requestPayload.name) : "",
    jira_link: jiraLink || null,
  };

  const missing = requestPayload
    ? REQUIRED_CREATE_FIELDS.filter((field) => {
        const value = requestPayload[field];
        return value === undefined || value === null || String(value).trim() === "";
      })
    : [...REQUIRED_CREATE_FIELDS];

  if (missing.length > 0) {
    const errorResponse = {
      responseCode: "BAD_REQUEST",
      responseMessage: `Missing required field(s): ${missing.join(", ")}`,
    };
    await logAudit({
      ...auditBase,
      request_payload: requestPayload || null,
      modified_payload: { missingFields: missing },
      status: "FAILURE",
      response_payload: errorResponse,
      message: errorResponse.responseMessage,
    });
    res.status(400).json(errorResponse);
    return;
  }

  // `id` is assigned upstream, so it is never forwarded on create.
  const upstreamRequest: Record<string, any> = {};
  CONFIG_FIELDS.forEach((field) => {
    if (field === "id") return;
    if (requestPayload[field] !== undefined) upstreamRequest[field] = requestPayload[field];
  });

  const data = upstreamRequest.data ?? {};
  const createdSummary = {
    created: true,
    name: upstreamRequest.name,
    type: upstreamRequest.type,
    subType: upstreamRequest.subType,
    portal: upstreamRequest.portal,
    clientVersion: upstreamRequest.clientVersion,
    criteria: upstreamRequest.criteria ?? null,
    dataSections: data && typeof data === "object" ? Object.keys(data) : [],
    dataSize: JSON.stringify(data ?? {}).length,
  };

  logger.info(`Creating forms config: ${upstreamRequest.name}`);

  try {
    const response = await axios({
      method: "POST",
      url: `${getKongBaseUrl()}${FORMS_CONFIG_CREATE_PATH}`,
      headers: createApiHeaders(req.user?.token),
      data: { request: upstreamRequest },
    });

    logger.info(`Successfully created forms config: ${upstreamRequest.name}`);

    await logAudit({
      ...auditBase,
      request_payload: { request: upstreamRequest },
      modified_payload: createdSummary,
      status: "SUCCESS",
      response_payload: response.data,
      message: `Created form config "${upstreamRequest.name}"`,
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    const errorMessage = `Error creating forms config: ${upstreamRequest.name}`;
    logger.error(`❌ ${errorMessage}`);

    const responsePayload = axios.isAxiosError(error) && error.response
      ? { status: error.response.status, data: error.response.data }
      : { message: error?.message || "Unknown error" };

    await logAudit({
      ...auditBase,
      request_payload: { request: upstreamRequest },
      modified_payload: createdSummary,
      status: "FAILURE",
      response_payload: responsePayload,
      message: errorMessage,
    });

    handleApiError(error, res, errorMessage);
  }
};
