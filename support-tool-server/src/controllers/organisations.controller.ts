import { Request, Response } from "express";
import { RequestHandler } from "express";
import request from "request";
import { connectPostgres } from "../utils/postgres";
import logger from "../utils/logger";

export const fetchOrganisations: RequestHandler = async (
  req: Request,
  res: Response
) => {
  logger.info("Fetching all organizations...");

  try {
    var options = {
      method: "POST",
      url: `${process.env.KONG_API_URL}api/org/v1/search`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
      },
      body: JSON.stringify({
        request: {
          filters: {
            isRootOrg: true,
          },
          offset: 0,
          limit: 1000,
          sort_by: {},
          fields: [],
        },
      }),
    };

    logger.debug(`API request options: ${JSON.stringify(options)}`);

    request(options, function (error, response, body) {
      if (error) {
        logger.error("Error fetching organisations:"+ error);
        res
          .status(500)
          .send({ message: "Internal server error", error: error.message });
      } 
      
      if (body) {
        logger.info(`Successfully fetched ${JSON.parse(body).result?.response?.count || 0} organizations`);
        res.status(200).send(body);
      } else {
        logger.error("Empty response body from organization API");
        res.status(500).send({ status: 500, message: "Internal server error" });
      }
    });
  } catch (error) {
    logger.error("❌ Error in fetchOrganisations controller:"+ error);
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