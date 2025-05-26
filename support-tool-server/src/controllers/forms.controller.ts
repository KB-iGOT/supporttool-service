import { Request, Response } from "express";
import { RequestHandler } from "express";
import { cassandraClient } from "../utils/cassandra";
import logger from "../utils/logger";

export const getFacetsForms: RequestHandler = async (
    req: any,
    res: Response
) => {
    logger.info("Getting forms facets from Cassandra");
    
    try {
        // Use qmzbm_form_service keyspace and query to select all form data fields
        const query = "SELECT root_org, framework, type, subtype, action, component FROM qmzbm_form_service.form_data";
        
        const result = await cassandraClient.execute(query, [], { prepare: true });
        
        if (!result || !result.rows || result.rows.length === 0) {
            logger.warn("No form data found in Cassandra (qmzbm_form_service.form_data)");
            res.status(404).json({
                status: 404,
                message: "No form data found"
            });
            return;
        }
        
        logger.info(`Retrieved ${result.rows.length} form records from qmzbm_form_service`);
        // Send the raw rows back to the client - much simpler!
        res.status(200).json({
            status: 200,
            message: "Form data retrieved successfully",
            result: {
                data: result.rows
            }
        });
        
    } catch (error) {
        logger.error("Error fetching forms data from Cassandra: " + error);
        
        // Provide more detailed error information for debugging
        const errorMessage = (error as any).message || "Unknown error";
        const errorCode = (error as any).code || "UNKNOWN";
        
        res.status(500).json({
            status: 500,
            message: "Error retrieving form data",
            error: errorMessage,
            code: errorCode
        });
    }
};


export const getFormRead: RequestHandler = async (
    req: any,
    res: Response
) => {
    logger.info("Getting form data based on selected parameters");
    
    try {
        // Extract filter parameters from request body
        const { 
            type,
            subtype,
            action,
            root_org,
            component,
            framework 
        } = req.body;
        
        // Validate required parameters
        if (!type || !subtype || !action || !root_org || !component || !framework) {
            logger.warn("Missing required parameters for form data query");
            res.status(400).json({
                status: 400,
                message: "All parameters (type, subtype, action, root_org, component, framework) are required"
            });
            return;
        }
        
        logger.info(`Querying form data with parameters: type=${type}, subtype=${subtype}, action=${action}, root_org=${root_org}, component=${component}, framework=${framework}`);
        
        // Build query with WHERE clauses for all parameters
        const query = `
            SELECT * FROM qmzbm_form_service.form_data 
            WHERE type = ? 
            AND subtype = ? 
            AND action = ? 
            AND root_org = ? 
            AND component = ? 
            AND framework = ?
        `;
        
        // Parameters in the same order as the query placeholders
        const params = [type, subtype, action, root_org, component, framework];
        
        // Execute the query with prepared statement
        const result = await cassandraClient.execute(query, params, { prepare: true });
        
        if (!result || !result.rows || result.rows.length === 0) {
            logger.warn(`No form data found matching the specified criteria`);
            res.status(404).json({
                status: 404,
                message: "No form data found matching the specified criteria"
            });
            return;
        }
        
        // Get the first matching form (should be unique given these parameters)
        const formData = result.rows[0];
        logger.info(`Successfully retrieved form data for the specified parameters`);
        
        // Send the complete form data
        res.status(200).json({
            status: 200,
            message: "Form data retrieved successfully",
            result: {
                formData
            }
        });
        
    } catch (error) {
        logger.error("Error fetching form data from Cassandra: " + error);
        
        // Provide detailed error information for debugging
        const errorMessage = (error as any).message || "Unknown error";
        const errorCode = (error as any).code || "UNKNOWN";
        
        logger.error(`Cassandra error details - Code: ${errorCode}, Message: ${errorMessage}`);
        res.status(500).json({
            status: 500,
            message: "Error retrieving form data",
            error: errorMessage,
            code: errorCode
        });
    }
};


export const createFormData: RequestHandler = async (
    req: any,
    res: Response
) => {
    logger.info("Creating new form data in Cassandra");
    
    try {
        // Extract all required parameters from request body
        const { 
            type,
            subtype,
            action,
            root_org,
            component,
            framework,
            data // The actual JSON data for the form
        } = req.body;
        
        // Validate required parameters
        if (!type || !subtype || !action || !root_org || !component || !framework) {
            logger.warn("Missing required parameters for form data creation");
            res.status(400).json({
                status: 400,
                message: "All parameters (type, subtype, action, root_org, component, framework) are required"
            });
            return;
        }
        
        // Validate formData is present
        if (!data) {
            logger.warn("Missing form data in request");
            res.status(400).json({
                status: 400,
                message: "Form data is required"
            });
            return;
        }
        
        // Check if a form with the same parameters already exists
        const checkQuery = `
            SELECT * FROM qmzbm_form_service.form_data 
            WHERE type = ? 
            AND subtype = ? 
            AND action = ? 
            AND root_org = ? 
            AND component = ? 
            AND framework = ?
        `;
        
        const checkParams = [type, subtype, action, root_org, component, framework];
        const checkResult = await cassandraClient.execute(checkQuery, checkParams, { prepare: true });
        
        if (checkResult.rows && checkResult.rows.length > 0) {
            logger.warn(`Form with the specified parameters already exists. Use update endpoint instead.`);
            res.status(409).json({
                status: 409,
                message: "A form with these parameters already exists. Use the update endpoint to modify existing forms."
            });
            return;
        }
        
        
        // Generate a timestamp for created_on field
        const createdOn = new Date().toISOString();
        
        // Prepare the insert query
        const insertQuery = `
            INSERT INTO qmzbm_form_service.form_data (
                type, 
                subtype, 
                action, 
                root_org, 
                component, 
                framework, 
                data, 
                created_on
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Convert formData to JSON string if it's an object
        const formDataString = typeof data === 'object' ? JSON.stringify(data) : data;
        
        // Parameters in the same order as the query placeholders
        const insertParams = [
            type, 
            subtype, 
            action, 
            root_org, 
            component, 
            framework, 
            formDataString, 
            createdOn
        ];
        
        logger.info(`Creating new form data with parameters: type=${type}, subtype=${subtype}, action=${action}, root_org=${root_org}, component=${component}, framework=${framework}`);
        
        // Execute the insert query
        await cassandraClient.execute(insertQuery, insertParams, { prepare: true });
        
        logger.info(`Successfully created new form data`);
        
        // Return success response
        res.status(200).json({
            status: 200,
            message: "Form data created successfully",
            result: {
                type,
                subtype,
                action,
                root_org,
                component,
                framework,
                created_on: createdOn
            }
        });
        
    } catch (error) {
        logger.error("Error creating form data in Cassandra: " + error);
        
        // Provide detailed error information for debugging
        const errorMessage = (error as any).message || "Unknown error";
        const errorCode = (error as any).code || "UNKNOWN";
        
        logger.error(`Cassandra error details - Code: ${errorCode}, Message: ${errorMessage}`);
        
        // Return error response
        res.status(500).json({
            status: 500,
            message: "Error creating form data",
            error: errorMessage,
            code: errorCode
        });
    }
};





export const updateFormData: RequestHandler = async (
    req: any,
    res: Response
) => {
    logger.info("Updating existing form data in Cassandra");
    
    try {
        // Extract all required parameters from request body
        const { 
            type,
            subtype,
            action,
            root_org,
            component,
            framework,
            data // The actual JSON data for the form
        } = req.body;
        
        // Validate required parameters
        if (!type || !subtype || !action || !root_org || !component || !framework) {
            logger.warn("Missing required parameters for form data update");
            res.status(400).json({
                status: 400,
                message: "All parameters (type, subtype, action, root_org, component, framework) are required"
            });
            return;
        }
        
        // Validate formData is present
        if (!data) {
            logger.warn("Missing form data in update request");
            res.status(400).json({
                status: 400,
                message: "Form data is required for update"
            });
            return;
        }
        
        // Check if the form with the specified parameters exists (we only update existing forms)
        const checkQuery = `
            SELECT created_on FROM qmzbm_form_service.form_data 
            WHERE type = ? 
            AND subtype = ? 
            AND action = ? 
            AND root_org = ? 
            AND component = ? 
            AND framework = ?
        `;
        
        const checkParams = [type, subtype, action, root_org, component, framework];
        const checkResult = await cassandraClient.execute(checkQuery, checkParams, { prepare: true });
        
        // If no form exists with these parameters, return an error
        if (!checkResult.rows || checkResult.rows.length === 0) {
            logger.warn(`Form with the specified parameters does not exist. Use create endpoint instead.`);
            res.status(404).json({
                status: 404,
                message: "No form found with these parameters. Use the create endpoint to create a new form."
            });
            return;
        }
        
        // Get the original creation timestamp to preserve it
        const originalCreatedOn = checkResult.rows[0].created_on;
        
        // Convert formData to JSON string if it's an object
        const formDataString = typeof data === 'object' ? JSON.stringify(data) : data;
        
        // Prepare the update query - only update the data field, preserve other fields
        const updateQuery = `
            UPDATE qmzbm_form_service.form_data 
            SET data = ?
            WHERE type = ? 
            AND subtype = ? 
            AND action = ? 
            AND root_org = ? 
            AND component = ? 
            AND framework = ?
        `;
        
        // Parameters in the order they appear in the query
        const updateParams = [
            formDataString,
            type, 
            subtype, 
            action, 
            root_org, 
            component, 
            framework
        ];
        
        logger.info(`Updating form data with parameters: type=${type}, subtype=${subtype}, action=${action}, root_org=${root_org}, component=${component}, framework=${framework}`);
        
        // Execute the update query - THIS WAS MISSING
        await cassandraClient.execute(updateQuery, updateParams, { prepare: true });
        
        logger.info(`Successfully updated form data`);
        
        // Send success response
        res.status(200).json({
            status: 200,
            message: "Form data updated successfully",
            result: {
                type,
                subtype,
                action,
                root_org,
                component,
                framework,
                created_on: originalCreatedOn
            }
        });
                
        
    } catch (error) {
        logger.error("Error updating form data in Cassandra: " + error);
        
        // Provide detailed error information for debugging
        const errorMessage = (error as any).message || "Unknown error";
        const errorCode = (error as any).code || "UNKNOWN";
        // Send error response
        res.status(500).json({
            status: 500,
            message: "Error updating form data",
            error: errorMessage,
            code: errorCode
        });
    }
};
















export const getFacetsFormsbackup: RequestHandler = async (
    req: any,
    res: Response
) => {
    logger.info("Getting forms facets from Cassandra");
    
    try {
        // Use qmzbm_form_service keyspace and query to select all form data fields
        const query = "SELECT root_org, framework, type, subtype, action, component FROM qmzbm_form_service.form_data";
        
        const result = await cassandraClient.execute(query, [], { prepare: true });
        
        if (!result || !result.rows || result.rows.length === 0) {
            logger.warn("No form data found in Cassandra (qmzbm_form_service.form_data)");
            res.status(404).json({
                status: 404,
                message: "No form data found"
            });
            return;
        }
        
        logger.info(`Retrieved ${result.rows.length} form records for facet generation from qmzbm_form_service`);
        
        // Process rows to extract unique values for each field
        const facets = {
            root_org: new Set<string>(),
            framework: new Set<string>(),
            type: new Set<string>(),
            subtype: new Set<string>(),
            action: new Set<string>(),
            component: new Set<string>()
        };
        
        // Extract unique values
        result.rows.forEach(row => {
            if (row.root_org) facets.root_org.add(row.root_org);
            if (row.framework) facets.framework.add(row.framework);
            if (row.type) facets.type.add(row.type);
            if (row.subtype) facets.subtype.add(row.subtype);
            if (row.action) facets.action.add(row.action);
            if (row.component) facets.component.add(row.component);
        });
        
        // Convert Sets to Arrays for the response
        const formattedFacets = {
            root_org: Array.from(facets.root_org).sort(),
            framework: Array.from(facets.framework).sort(),
            type: Array.from(facets.type).sort(),
            subtype: Array.from(facets.subtype).sort(),
            action: Array.from(facets.action).sort(),
            component: Array.from(facets.component).sort()
        };
        
        // Format response in a structure similar to other facet APIs
        const response = {
            status: 200,
            message: "Facets retrieved successfully",
            result: {
                facets: [
                    {
                        name: "root_org",
                        values: formattedFacets.root_org.map(value => ({
                            name: value,
                            count: result.rows.filter(row => row.root_org === value).length
                        }))
                    },
                    {
                        name: "framework",
                        values: formattedFacets.framework.map(value => ({
                            name: value,
                            count: result.rows.filter(row => row.framework === value).length
                        }))
                    },
                    {
                        name: "type",
                        values: formattedFacets.type.map(value => ({
                            name: value,
                            count: result.rows.filter(row => row.type === value).length
                        }))
                    },
                    {
                        name: "subtype",
                        values: formattedFacets.subtype.map(value => ({
                            name: value,
                            count: result.rows.filter(row => row.subtype === value).length
                        }))
                    },
                    {
                        name: "action",
                        values: formattedFacets.action.map(value => ({
                            name: value,
                            count: result.rows.filter(row => row.action === value).length
                        }))
                    },
                    {
                        name: "component",
                        values: formattedFacets.component.map(value => ({
                            name: value,
                            count: result.rows.filter(row => row.component === value).length
                        }))
                    }
                ]
            }
        };
        logger.info(`Successfully generated facets with ${Object.keys(formattedFacets).length} categories`);
        
        // Send the facets data back to the client
        res.status(200).json(response);
        
    } catch (error) {
        logger.error("Error fetching forms facets from Cassandra: " + error);
        
        // Provide more detailed error information for debugging
        const errorMessage = (error as any).message || "Unknown error";
        const errorCode = (error as any).code || "UNKNOWN";
        
        logger.error(`Cassandra error details - Code: ${errorCode}, Message: ${errorMessage}`);
        
        res.status(500).json({
            status: 500,
            message: "Error retrieving form facets",
            error: errorMessage,
            code: errorCode
        });
    }
};

