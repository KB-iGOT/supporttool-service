import { Request, Response } from "express";
import { RequestHandler } from "express";
import { cassandraClient } from "../utils/cassandra";
import logger from "../utils/logger";
import logAudit from "../helpers/auditLogger";
import getClientIp from "../helpers/getClientIp";

interface AuditObject {
    user_id: string;
    module: string;
    sub_module: string | null;
    action: string;
    entity_id: string;
    request_payload: any;
    modified_payload: any;
    response_payload: string | null;
    ip_address: string | null;
    user_agent: string | null;
    status: string | null;
    message: string | null;
    jira_link: string | null;
}

// Utility function to create audit object
const createAuditObject = (
    user_id: string,
    module: string,
    sub_module: string,
    action: string,
    entity_id: string,
    request_payload: any,
    modified_payload: any,
    jira_link?: string,
    ip_address?: string | null,
): AuditObject => ({
    user_id,
    module,
    sub_module,
    action,
    entity_id,
    request_payload,
    modified_payload,
    response_payload: null,
    ip_address: ip_address || null,
    user_agent: null,
    status: null,
    message: null,
    jira_link: jira_link || null,
});

export const fetchDomains: RequestHandler = async (
  req: Request,
  res: Response
) => {
  console.log("Fetching domain data from Cassandra...");
  
  try {
    // Define both context types to fetch
    const contextTypes = ['userRegistrationDomain', 'userRegistrationPreApprovedDomain'];
    
    // Prepare the query with parameterization to prevent injection
    const query = 'SELECT * FROM sunbird.master_data WHERE contexttype = ? ALLOW FILTERING';
    
    // Execute queries for both context types
    const allDomains: any[] = [];
    
    for (const contextType of contextTypes) {
      const result = await cassandraClient.execute(query, [contextType], { prepare: true });
      console.log(`Found ${result.rows.length} domains for contextType: ${contextType}`);
      
      // Map the result rows and add to combined array
      const domains = result.rows.map((row: any) => ({
        id: row.id ? row.id.toString() : undefined,
        contextType: row.contexttype,
        contextName: row.contextname,
        // Add any other fields you want to include
        createdOn: row.createdon,
        updatedOn: row.updatedon
      }));
      
      allDomains.push(...domains);
    }
    
    console.log(`Total domains found across both context types: ${allDomains.length}`);
    
    // Check if any data was found
    if (allDomains.length === 0) {
      res.status(404).json({
        status: 404,
        message: `No domain data found for context types: ${contextTypes.join(', ')}`,
        data: []
      });
      return;
    }
    
    // Sort domains by contextType and then by contextName for better organization
    allDomains.sort((a, b) => {
      if (a.contextType !== b.contextType) {
        return a.contextType.localeCompare(b.contextType);
      }
      return a.contextName.localeCompare(b.contextName);
    });
    
    // Return the combined results
    res.status(200).json({
      status: 200,
      message: "Domain data retrieved successfully",
      data: allDomains,
      totalCount: allDomains.length,
      breakdown: {
        userRegistrationDomain: allDomains.filter(d => d.contextType === 'userRegistrationDomain').length,
        userRegistrationPreApprovedDomain: allDomains.filter(d => d.contextType === 'userRegistrationPreApprovedDomain').length
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching domain data from Cassandra:", error);
    res.status(500).json({
      status: 500,
      message: "Internal server error while fetching domain data",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const addDomain: RequestHandler = async (
  req: Request,
  res: Response
) => {
  logger.info("Adding new domain to Cassandra..." + JSON.stringify(req.body));
  
  const {
    request: requestData,
    jiraLink,
    module,
  } = req.body;
  const user_id = req.headers["x-user-id"] as string;
  
  try {
    // Extract domain data from request body
    const contextName = requestData?.contextName;
    const contextType = 'userRegistrationPreApprovedDomain';
    
    // Validate inputs
    if (!contextName) {
      res.status(400).json({
        status: 400,
        message: "Context name is required"
      });
      return;
    }
    
    // First, check if the domain already exists
    const checkQuery = 'SELECT contextname FROM sunbird.master_data WHERE contexttype = ? AND contextname = ? ALLOW FILTERING';
    
    const checkResult = await cassandraClient.execute(
      checkQuery,
      [contextType, contextName.trim()],
      { prepare: true }
    );
    
    // If rows are returned, the domain already exists
    if (checkResult.rows.length > 0) {
      // Create audit object for failed attempt
      const auditObject = createAuditObject(
        user_id,
        module || 'domains',
        'DOMAIN_ADD',
        "CREATE",
        contextName.trim(),
        requestData,
        { error: "Domain already exists" },
        jiraLink,
        getClientIp(req)
      );
      
      await logAudit({
        ...auditObject,
        status: "FAILURE",
        response_payload: JSON.stringify({
          message: `Domain "${contextName}" already exists`
        }),
        message: "Domain creation failed - duplicate domain",
      });
      
      res.status(409).json({
        status: 409,
        message: `Domain "${contextName}" already exists`,
        error: "Duplicate domain"
      });
      return;
    }
    
    const currentTimestamp = new Date();
    
    // Prepare the query with parameterization to prevent injection
    const query = `
      INSERT INTO sunbird.master_data
      (contexttype, contextname)
      VALUES (?, ?)
    `;
    
    // Execute the query with parameters
    await cassandraClient.execute(
      query, 
      [
        contextType,
        contextName.trim()
      ],
      { prepare: true }
    );
    
    logger.info(`Domain added successfully: ${contextName} (${contextType})`);
    
    // Response object
    const response = {
      contextType,
      contextName: contextName.trim(),
      createdOn: currentTimestamp,
      updatedOn: currentTimestamp
    };
    
    // Create audit object for successful creation
    const auditObject = createAuditObject(
      user_id,
      module || 'domains',
      'DOMAIN_ADD',
      "CREATE",
      contextName.trim(),
      requestData,
      { createdDomain: response },
      jiraLink,
      getClientIp(req)
    );
    
    // Log the audit entry
    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response),
      message: "Domain created successfully",
    });
    
    // Return success response
    res.status(201).json({
      status: 201,
      message: "Domain added successfully",
      data: response
    });
    
  } catch (error) {
    logger.error("❌ Error adding domain to Cassandra:" + JSON.stringify(error));

    // Handle audit logging for failure
    try {
      const auditErrorObject = createAuditObject(
        user_id,
        module || 'domains',
        'DOMAIN_ADD',
        "CREATE",
        requestData?.contextName || 'unknown',
        requestData,
        { error: (error as any).message },
        jiraLink,
        getClientIp(req)
      );
      
      await logAudit({
        ...auditErrorObject,
        status: "FAILURE",
        response_payload: JSON.stringify({
          message: (error as any).message || "Unknown error"
        }),
        message: "Domain creation failed",
      });
    } catch (auditError) {
      logger.error("Failed to log audit for failed domain creation: " + auditError);
    }
    
    res.status(500).json({
      status: 500,
      message: "Internal server error while adding domain",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export const deleteDomain: RequestHandler = async (
  req: Request,
  res: Response
) => {
  logger.info("Deleting domain from Cassandra..." + JSON.stringify(req.params));
  
  const {
    jiraLink,
    module,
  } = req.body;
  const user_id = req.headers["x-user-id"] as string;
  
  try {
    // Extract domain id from request params
    const domainName = req.params.id as string;
    const contextType = 'userRegistrationPreApprovedDomain';
    
    if (!domainName) {
      res.status(400).json({
        status: 400,
        message: "Domain ID is required"
      });
      return;
    }
    
    // First, fetch the existing domain data to track what's being deleted
    const fetchQuery = 'SELECT * FROM sunbird.master_data WHERE contextname = ? and contexttype = ?';
    const fetchResult = await cassandraClient.execute(fetchQuery, [domainName, contextType], { prepare: true });
    
    // If no domain exists, return an error
    if (!fetchResult.rows || fetchResult.rows.length === 0) {
      // Create audit object for failed attempt
      const auditObject = createAuditObject(
        user_id,
        module || 'domains',
        'DOMAIN_DELETE',
        "DELETE",
        domainName,
        { domainName, contextType },
        { error: "Domain not found" },
        jiraLink,
        getClientIp(req)
      );
      
      await logAudit({
        ...auditObject,
        status: "FAILURE",
        response_payload: JSON.stringify({
          message: "Domain not found"
        }),
        message: "Domain deletion failed - domain not found",
      });
      
      res.status(404).json({
        status: 404,
        message: "Domain not found"
      });
      return;
    }
    
    // Get the existing domain data for audit logging
    const existingDomain = fetchResult.rows[0];
    
    // Prepare the delete query
    const deleteQuery = 'DELETE FROM sunbird.master_data WHERE contextname = ? and contexttype = ?';
    
    // Execute the delete query
    await cassandraClient.execute(deleteQuery, [domainName, contextType], { prepare: true });
    
    logger.info(`Domain deleted successfully: ${domainName}`);
    
    // Response object
    const response = {
      contextName: domainName,
      contextType,
      deleted_at: new Date().toISOString()
    };
    
    // Create audit object for successful deletion
    const auditObject = createAuditObject(
      user_id,
      module || 'domains',
      'DOMAIN_DELETE',
      "DELETE",
      domainName,
      { domainName, contextType },
      { deletedDomain: existingDomain },
      jiraLink,
      getClientIp(req)
    );
    
    // Log the audit entry
    await logAudit({
      ...auditObject,
      status: "SUCCESS",
      response_payload: JSON.stringify(response),
      message: "Domain deleted successfully",
    });
    
    // Return success response
    res.status(200).json({
      status: 200,
      message: "Domain deleted successfully",
      data: response
    });
    
  } catch (error) {
    logger.error("❌ Error deleting domain from Cassandra:" + JSON.stringify(error));

    // Handle audit logging for failure
    try {
      const auditErrorObject = createAuditObject(
        user_id,
        module || 'domains',
        'DOMAIN_DELETE',
        "DELETE",
        (req.params.id as string) || 'unknown',
        { domainName: req.params.id },
        { error: (error as any).message },
        jiraLink,
        getClientIp(req)
      );
      
      await logAudit({
        ...auditErrorObject,
        status: "FAILURE",
        response_payload: JSON.stringify({
          message: (error as any).message || "Unknown error"
        }),
        message: "Domain deletion failed",
      });
    } catch (auditError) {
      logger.error("Failed to log audit for failed domain deletion: " + auditError);
    }
    
    res.status(500).json({
      status: 500,
      message: "Internal server error while deleting domain",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};