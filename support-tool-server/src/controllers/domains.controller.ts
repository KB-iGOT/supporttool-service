import { Request, Response } from "express";
import { RequestHandler } from "express";
import { cassandraClient } from "../utils/cassandra";

export const fetchDomains: RequestHandler = async (
  req: Request,
  res: Response
) => {
  console.log("Fetching domain data from Cassandra...");
  
  try {
    // Get the contextType parameter from query, defaulting to 'userRegistrationPreApprovedDomain' if not provided
    const contextType = req.query.contextType as string || 'userRegistrationPreApprovedDomain';
    
    // Prepare the query with parameterization to prevent injection
    const query = 'SELECT * FROM sunbird.master_data WHERE contexttype = ? ALLOW FILTERING';
    
    // Execute the query
    const result = await cassandraClient.execute(query, [contextType], { prepare: true });
    
    console.log(`Found ${result.rows.length} domains for contextType: ${contextType}`);
    
    // Check if any data was found
    if (result.rows.length === 0) {
      res.status(404).json({
        status: 404,
        message: `No domain data found for contextType: ${contextType}`,
        data: []
      });
      return;
    }
    
    // Map the result rows to a more user-friendly format if needed
    const domains = result.rows.map((row: any) => ({
      id: row.id ? row.id.toString() : undefined,
      contextType: row.contexttype,
      contextName: row.contextname,
      // Add any other fields you want to include
      createdOn: row.createdon,
      updatedOn: row.updatedon
    }));
    
    // Return the results
    res.status(200).json({
      status: 200,
      message: "Domain data retrieved successfully",
      data: domains,
      totalCount: domains.length
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
  console.log("Adding new domain to Cassandra...", req.body);
  
  try {
    // Extract domain data from request body
    const contextName = req.body.request.contextName;
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
    const result = await cassandraClient.execute(
      query, 
      [
        contextType,
        contextName.trim()
      ],
      { prepare: true }
    );
    
    console.log(`Domain added successfully: ${contextName} (${contextType})`);
    // Return success response
    res.status(201).json({
      status: 201,
      message: "Domain added successfully",
      data: {
        contextType,
        contextName,
        createdOn: currentTimestamp,
        updatedOn: currentTimestamp
      }
    });
    
  } catch (error) {
    console.error("❌ Error adding domain to Cassandra:", error);
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
  console.log("Deleting domain from Cassandra...", req.params);
  
  try {
    // Extract domain id from request params
    const domainName = req.params.id;
    
    if (!domainName) {
      res.status(400).json({
        status: 400,
        message: "Domain ID is required"
      });
      return;
    }
    
    // Prepare the delete query
    const deleteQuery = 'DELETE FROM sunbird.master_data WHERE contextname = ? and contexttype = ?';
    
    // Execute the delete query
    await cassandraClient.execute(deleteQuery, [domainName,'userRegistrationPreApprovedDomain'], { prepare: true });
    
    // Return success response
    res.status(200).json({
      status: 200,
      message: "Domain deleted successfully",
      data: {
        contextName:domainName
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Internal server error while deleting domain",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};