import { Request, Response } from "express";
import { RequestHandler } from "express";
import axios from "axios";
import { connectPostgres } from "../utils/postgres";
import logger from "../utils/logger";
import logAudit from "../helpers/auditLogger";
import getClientIp from "../helpers/getClientIp";
import { fetchAdminAccessToken, createApiHeaders } from "../helpers/apiHelpers";

export const fetchOrganisations: RequestHandler = async (
  req: Request,
  res: Response
) => {
  logger.info("Fetching organizations with search criteria...");

  try {
    const options = {
      method: "POST",
      url: `${process.env.KONG_API_URL}api/org/v1/search`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
      },
      data: req.body, // Pass the request body from the client
    };

    logger.debug(`API request options: ${JSON.stringify(options)}`);

    const response = await axios(options);

    if (response.data) {
      logger.info(`Successfully fetched ${JSON.stringify(response.data)} organizations`);
      res.status(200).send(response.data);
    } else {
      logger.error("Empty response body from organization API");
      res.status(500).send({ status: 500, message: "Internal server error" });
    }
  } catch (error) {
    logger.error("❌ Error in fetchOrganisations controller:" + error);
    res.status(500).send({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const fetchOrganisationByName: RequestHandler = async (
  req: Request,
  res: Response
) => {
  logger.info(`Fetching organisation by name: ${req.params.id}`);
  
  try {
    const orgName = req.params.id as string;
    
    if (!orgName) {
      logger.warn("Organization name not provided in request");
      res.status(400).json({
        status: 400,
        message: "Organization name is required"
      });
      return;
    }
    
    // Connect to Postgres
    logger.debug("Connecting to Postgres database");
    
    // Execute query with proper parameterization to prevent SQL injection
    logger.debug(`Executing query for organization: ${orgName}`);
    const queryResult = await connectPostgres.query(
      'SELECT * FROM org_hierarchy_v4 WHERE orgname = $1',
      [orgName]
    );
    
    logger.debug("Query result:"+JSON.stringify(queryResult));
    if (queryResult.rows.length === 0) {
      logger.info(`Organization with name '${orgName}' not found`);
      res.status(404).json({
        status: 404,
        message: `Organization with name '${orgName}' not found`
      });
      return;
    }

    logger.info(`Successfully retrieved organization: ${orgName}`);
    res.status(200).json({
      status: 200,
      message: "Organization data retrieved successfully",
      data: queryResult.rows[0]
    });
    } 
    catch (error) {
    logger.error("❌ Error fetching organization by name:"+ error);
      res.status(500).json({ 
        status: 500, 
        message: "Internal server error", 
        error: error instanceof Error ? error.message : String(error)
      });
  }
};

export const deleteOrganisationById: RequestHandler = async (
  req: Request,
  res: Response
) => {
  logger.info(`Deleting organisation by ID: ${req.params.id}`);
  
  try {
    const orgId = req.params.id;
    
    if (!orgId) {
      logger.warn("Organization ID not provided in request");
       res.status(400).send({
        status: 400,
        message: "Organization ID is required"
      });
    }
    
    // First check if organization exists and get its name
    logger.debug(`Checking if organization exists: ${orgId}`);
    const checkResult = await connectPostgres.query(
      'SELECT orgname FROM org_hierarchy_v4 WHERE id = $1',
      [orgId]
    );
    
    if (checkResult.rows.length === 0) {
      logger.info(`Organization with ID '${orgId}' not found`);
       res.status(404).send({
        status: 404,
        message: `Organization with ID '${orgId}' not found`
      });
    }
    
    const orgName = checkResult.rows[0].orgname;
    logger.info(`Found organization to delete: ${orgName} (ID: ${orgId})`);
    
    // Execute delete query with proper parameterization to prevent SQL injection
    logger.debug(`Executing delete query for organization ID: ${orgId}`);
    const deleteResult = await connectPostgres.query(
      'DELETE FROM org_hierarchy_v4 WHERE id = $1',
      [orgId]
    );
    
    logger.debug(`Delete result: ${deleteResult.rowCount} rows affected`);
    
    if (deleteResult.rowCount === 0) {
      logger.error(`Failed to delete organization with ID: ${orgId}`);
       res.status(500).send({
        status: 500,
        message: "Failed to delete organization"
      });
    }
    
    logger.info(`Successfully deleted organization: ${orgName} (ID: ${orgId})`);
     res.status(200).send({
      status: 200,
      message: `Organization '${orgName}' deleted successfully`,
      data: {
        id: orgId,
        name: orgName,
        deletedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error("❌ Error deleting organization:"+ error);
     res.status(500).send({ 
      status: 500, 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}


export const fetchOrganisationsData: RequestHandler = async (
  req: Request,
  res: Response
) => {
  logger.info("Fetching organizations data...");
  try {
    const options = {
      method: "POST",
      url: `${process.env.KONG_API_URL}api/org/v1/search`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
      },
      data: req.body,
    };
    logger.debug(`API request options: ${JSON.stringify(options)}`);

    const response = await axios(options);

    logger.info(`Successfully fetched ${JSON.stringify(response?.data)} organizations`);
    res.status(200).send(response?.data);
  } catch (error) {
    logger.error("❌ Error in fetchOrganisationsData controller:" + error);
    res.status(500).send({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const updateOrganisationStatus: RequestHandler = async (
  req: any,
  res: Response
) => {
  const {
    payload,
    changedFields,
    userId,
    jiraLink,
    module,
  } = req.body;
  const user_id = req.headers["x-user-id"];

  logger.info(`Updating organization status: ${userId}`);

  const auditObject = {
    user_id,
    module: module || "Organisation Management",
    sub_module: "UPDATE_ORGANISATION_STATUS",
    action: "UPDATE",
    entity_id: userId || '',
    request_payload: payload,
    modified_payload: changedFields,
    response_payload: null as string | null,
    ip_address: getClientIp(req),
    user_agent: null as string | null,
    status: null as string | null,
    message: null as string | null,
    jira_link: jiraLink || null,
  };

  if (!user_id) {
    const error = {
      status: 400,
      responseCode: "CLIENT_ERROR",
      responseMessage: "User ID is required",
    };
    
    await logAudit({
      ...auditObject,
      status: "FAILURE",
      response_payload: JSON.stringify(error),
      message: error.responseMessage,
    });

    res.status(400).json(error);
    return;
  }

  try {
    const adminToken = await fetchAdminAccessToken();

    const options = {
      method: "PATCH",
      url: `${process.env.KONG_API_URL}api/org/v1/status/update`,
      headers: createApiHeaders(adminToken),
      data: payload,
    };

    logger.debug(`API request options: ${JSON.stringify(options)}`);

    const response = await axios(options);

    logger.info(`Organization ${userId} status updated successfully`);
    
    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response.data),
      message: "Organization status updated successfully",
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    logger.error("❌ Error updating organization status:" + error);
    
    let responsePayload = '';
    let status = "FAILURE";
    
    if (error.response) {
      responsePayload = JSON.stringify(error.response.data || {});
    } else if (error.request) {
      responsePayload = JSON.stringify({ message: "No response received from API" });
      status = "SERVICE_UNAVAILABLE";
    } else {
      responsePayload = JSON.stringify({ message: error.message });
      status = "SERVICE_UNAVAILABLE";
    }
    
    await logAudit({
      ...auditObject,
      status,
      response_payload: responsePayload,
      message: `Error updating organization status for ${userId}`,
    });

    if (error.response) {
      res.status(error.response.status).json({
        responseCode: "API_ERROR",
        responseMessage: `Error updating organization status for ${userId}`,
        error: error.response.data,
      });
    } else if (error.request) {
      res.status(503).json({
        responseCode: "SERVICE_UNAVAILABLE",
        responseMessage: "No response received from API",
        error: "Service unavailable",
      });
    } else {
      res.status(500).json({
        responseCode: "SERVER_ERROR",
        responseMessage: "Internal server error",
        error: error.message,
      });
    }
  }
};
export const fetchOrgEligibility: RequestHandler = async (
  req: any,
  res: Response
) => {
  const orgId = String(req.params.orgId || '');
  logger.info(`Fetching org eligibility contents for org: ${orgId}`);

  if (!orgId) {
    res.status(400).json({ message: "Organisation ID is required" });
    return;
  }

  try {
    const response = await axios({
      method: "GET",
      url: `${process.env.KONG_API_URL}api/orgeligibility/v1/read/${encodeURIComponent(orgId)}`,
      headers: createApiHeaders(req.user.token),
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    // The eligibility API answers 400 "Org eligibility not found" for orgs with no record yet
    const upstreamErr = error.response?.data?.params?.err;
    if (typeof upstreamErr === "string" && upstreamErr.toLowerCase().includes("not found")) {
      logger.info(`No org eligibility record yet for org: ${orgId}`);
      res.status(200).json({ result: { orgId, courseIds: [], courseCount: 0 } });
      return;
    }

    logger.error("❌ Error fetching org eligibility:" + error);

    if (error.response) {
      res.status(error.response.status).json({
        message: "Error from org eligibility API",
        error: error.response.data,
      });
    } else if (error.request) {
      res.status(503).json({
        message: "No response from org eligibility API",
        error: "Service unavailable",
      });
    } else {
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
};

export const upsertOrgEligibility: RequestHandler = async (
  req: any,
  res: Response
) => {
  const { payload, changedFields, jiraLink, module } = req.body;
  const user_id = req.headers["x-user-id"];
  const orgId = payload?.orgId;

  logger.info(`Upserting org eligibility contents for org: ${orgId}`);

  const auditObject = {
    user_id,
    module: module || "Organisation Management",
    sub_module: "UPSERT_ORG_ELIGIBILITY",
    action: "UPDATE",
    entity_id: orgId || '',
    request_payload: payload,
    modified_payload: changedFields,
    response_payload: null as string | null,
    ip_address: getClientIp(req),
    user_agent: null as string | null,
    status: null as string | null,
    message: null as string | null,
    jira_link: jiraLink || null,
  };

  if (!user_id || !orgId || !Array.isArray(payload?.courseIds)) {
    const error = {
      status: 400,
      responseCode: "CLIENT_ERROR",
      responseMessage: !user_id ? "User ID is required" : "orgId and courseIds are required",
    };

    await logAudit({
      ...auditObject,
      status: "FAILURE",
      response_payload: JSON.stringify(error),
      message: error.responseMessage,
    });

    res.status(400).json(error);
    return;
  }

  try {
    const response = await axios({
      method: "POST",
      url: `${process.env.KONG_API_URL}api/orgeligibility/v1/upsert`,
      headers: createApiHeaders(req.user.token),
      data: payload,
    });

    logger.info(`Org eligibility contents updated for org: ${orgId}`);

    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response.data),
      message: "Org eligibility contents updated successfully",
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    logger.error("❌ Error upserting org eligibility:" + error);

    let responsePayload = '';
    let status = "FAILURE";

    if (error.response) {
      responsePayload = JSON.stringify(error.response.data || {});
    } else if (error.request) {
      responsePayload = JSON.stringify({ message: "No response received from API" });
      status = "SERVICE_UNAVAILABLE";
    } else {
      responsePayload = JSON.stringify({ message: error.message });
      status = "SERVICE_UNAVAILABLE";
    }

    await logAudit({
      ...auditObject,
      status,
      response_payload: responsePayload,
      message: `Error updating org eligibility contents for ${orgId}`,
    });

    if (error.response) {
      res.status(error.response.status).json({
        responseCode: "API_ERROR",
        responseMessage: `Error updating org eligibility contents for ${orgId}`,
        error: error.response.data,
      });
    } else if (error.request) {
      res.status(503).json({
        responseCode: "SERVICE_UNAVAILABLE",
        responseMessage: "No response received from API",
        error: "Service unavailable",
      });
    } else {
      res.status(500).json({
        responseCode: "SERVER_ERROR",
        responseMessage: "Internal server error",
        error: error.message,
      });
    }
  }
};
