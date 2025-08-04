import { Request, Response } from "express";
import { RequestHandler } from "express";
import { cassandraClient } from "../utils/cassandra";
import logger from "../utils/logger";
import logAudit from "../helpers/auditLogger";

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

// Utility functions
const createAuditObject = (
    user_id: string,
    module: string,
    sub_module: string,
    action: string,
    entity_id: string,
    request_payload: any,
    modified_payload: any,
    jira_link?: string,
): AuditObject => ({
    user_id,
    module,
    sub_module,
    action,
    entity_id,
    request_payload,
    modified_payload,
    response_payload: null,
    ip_address: null,
    user_agent: null,
    status: null,
    message: null,
    jira_link: jira_link || null,
});

/**
 * Generates a detailed diff between two objects, tracking added, modified, and deleted keys
 * with improved array handling to reduce payload size
 */
const generateDetailedDiff = (original: any, updated: any, path: string = ''): any => {
    // If types are different, consider it a complete change
    if (typeof original !== typeof updated) {
        return {
            [path || 'root']: {
                original,
                new: updated
            }
        };
    }

    // For non-objects or null values, simply compare
    if (typeof original !== 'object' || original === null || updated === null) {
        if (original !== updated) {
            return {
                [path || 'root']: {
                    original,
                    new: updated
                }
            };
        }
        return {};
    }

    // Handle arrays - simplify to just use array indices
    if (Array.isArray(original) && Array.isArray(updated)) {
        const changes: Record<string, any> = {};
        
        // If arrays have different lengths, note that explicitly
        if (original.length !== updated.length) {
            changes[`${path}.length`] = {
                original: original.length,
                new: updated.length
            };
        }
        
        // Compare elements by index, which is more efficient and avoids duplication
        const maxLength = Math.max(original.length, updated.length);
        
        for (let i = 0; i < maxLength; i++) {
            // Item was added (exists in updated but not in original)
            if (i >= original.length) {
                changes[`${path}[${i}]`] = {
                    original: undefined,
                    new: updated[i]
                };
            }
            // Item was removed (exists in original but not in updated)
            else if (i >= updated.length) {
                changes[`${path}[${i}]`] = {
                    original: original[i],
                    new: undefined
                };
            }
            // Item exists in both arrays - compare for changes
            else if (JSON.stringify(original[i]) !== JSON.stringify(updated[i])) {
                // For objects, do deep comparison
                if (typeof original[i] === 'object' && original[i] !== null &&
                    typeof updated[i] === 'object' && updated[i] !== null) {
                    
                    // Instead of checking percentage of changes, always use property-level diffing for array objects
                    const itemPath = `${path}[${i}]`;
                    
                    // For arrays of objects, always recurse to get property-level changes
                    if (!Array.isArray(original[i]) && !Array.isArray(updated[i])) {
                        // Diff individual properties within objects
                        Object.keys({...original[i], ...updated[i]}).forEach(key => {
                            const propPath = `${itemPath}.${key}`;
                            const origValue = original[i][key];
                            const newValue = updated[i][key];
                            
                            // Only add to changes if the property actually changed
                            if (JSON.stringify(origValue) !== JSON.stringify(newValue)) {
                                // For nested objects, recurse further
                                if (typeof origValue === 'object' && origValue !== null &&
                                    typeof newValue === 'object' && newValue !== null) {
                                    const deepChanges = generateDetailedDiff(origValue, newValue, propPath);
                                    Object.assign(changes, deepChanges);
                                } else {
                                    // For primitive values, just note the property change
                                    changes[propPath] = {
                                        original: origValue,
                                        new: newValue
                                    };
                                }
                            }
                        });
                    } else {
                        // For nested arrays, recurse normally
                        const nestedChanges = generateDetailedDiff(original[i], updated[i], itemPath);
                        Object.assign(changes, nestedChanges);
                    }
                } else {
                    // For primitive values, just note the change
                    changes[`${path}[${i}]`] = {
                        original: original[i],
                        new: updated[i]
                    };
                }
            }
        }
        
        return changes;
    }

    // For regular objects, recursively check each key
    const changes: Record<string, any> = {};

    // Check keys in original that might be changed or deleted
    Object.keys(original).forEach(key => {
        const currentPath = path ? `${path}.${key}` : key;

        // Key was deleted
        if (!(key in updated)) {
            changes[currentPath] = {
                original: original[key],
                new: undefined
            };
            return;
        }

        // Recursively check nested changes
        const nestedChanges = generateDetailedDiff(original[key], updated[key], currentPath);
        Object.assign(changes, nestedChanges);
    });

    // Check keys in updated that might be new
    Object.keys(updated).forEach(key => {
        const currentPath = path ? `${path}.${key}` : key;

        // Key was added
        if (!(key in original)) {
            changes[currentPath] = {
                original: undefined,
                new: updated[key]
            };
        }
    });

    return changes;
};

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
    const {
        payload,
        changedFields,
        userId,
        jiraLink,
        module,
    } = req.body;
    const user_id = req.headers["x-user-id"];

    try {
        // Extract all required parameters from request body
        const { 
            type,
            subtype,
            action,
            root_org,
            component,
            framework,
            data // The new JSON data for the form
        } = payload;
        
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
        
        // First, fetch the existing form data to track changes
        const fetchQuery = `
            SELECT * FROM qmzbm_form_service.form_data 
            WHERE type = ? 
            AND subtype = ? 
            AND action = ? 
            AND root_org = ? 
            AND component = ? 
            AND framework = ?
        `;
        
        const fetchParams = [type, subtype, action, root_org, component, framework];
        const fetchResult = await cassandraClient.execute(fetchQuery, fetchParams, { prepare: true });
        
        // If no form exists with these parameters, return an error
        if (!fetchResult.rows || fetchResult.rows.length === 0) {
            logger.warn(`Form with the specified parameters does not exist. Use create endpoint instead.`);
            res.status(404).json({
                status: 404,
                message: "No form found with these parameters. Use the create endpoint to create a new form."
            });
            return;
        }
        
        // Get the existing form data and creation timestamp
        const existingForm = fetchResult.rows[0];
        const originalCreatedOn = existingForm.created_on;
        
        // Parse the existing form data from string to object
        let existingData = {};
        try {
            existingData = JSON.parse(existingForm.data);
        } catch (e) {
            logger.warn(`Could not parse existing form data as JSON: ${e}`);
            // Continue with empty object if parsing fails
        }
        
        // Get detailed changes by comparing objects
        const detailedChanges = generateDetailedDiff(existingData, data);
        
        // Create structured object for audit tracking with detailed changes
        const structuredChanges = {
            // Add detailed path-based changes
            detailedChanges: detailedChanges,
            // Summary stats
            changeStats: {
                totalChanges: Object.keys(detailedChanges).length,
                changeTypes: {
                    added: Object.entries(detailedChanges)
                        .filter(([_, change]) => (change as any).original === undefined).length,
                    modified: Object.entries(detailedChanges)
                        .filter(([_, change]) => (change as any).original !== undefined && (change as any).new !== undefined).length,
                    deleted: Object.entries(detailedChanges)
                        .filter(([_, change]) => (change as any).new === undefined).length
                }
            }
        };
        
        // Log a sample of changes (not all to avoid flooding logs)
        const changePaths = Object.keys(detailedChanges);
        if (changePaths.length > 0) {
            logger.info(`Form changes detected: ${changePaths.length} paths changed`);
            if (changePaths.length <= 10) {
                logger.info(`Changed paths: ${changePaths.join(', ')}`);
            } else {
                logger.info(`Sample of changed paths: ${changePaths.slice(0, 10).join(', ')}... and ${changePaths.length - 10} more`);
            }
        }
        
        console.log(`Structured changes for audit: ${JSON.stringify(structuredChanges)}`);
        // Create audit object with structured changes
        const auditObject = createAuditObject(
            user_id,
            module || 'forms',
            'FORM_UPDATE',
            "UPDATE",
            `${type}:${subtype}:${action}:${root_org}:${component}:${framework}`, // composite ID
            payload,
            structuredChanges,
            jiraLink
        );
        
        // Convert new form data to JSON string if it's an object
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
        
        // Execute the update query
        await cassandraClient.execute(updateQuery, updateParams, { prepare: true });
        
        logger.info(`Successfully updated form data`);
        
        // Response object
        const response = {
            type,
            subtype,
            action,
            root_org,
            component,
            framework,
            created_on: originalCreatedOn
        };
        
        // Log the audit entry
        await logAudit({
            ...auditObject,
            status: "SUCCESS",
            response_payload: JSON.stringify(response),
            message: "Form data updated successfully",
        });
        
        // Send success response
        res.status(200).json({
            status: 200,
            message: "Form data updated successfully",
            result: response
        });
    } catch (error) {
        logger.error("Error updating form data in Cassandra: " + error);
        
        // Handle audit logging for failure
        try {
            const auditErrorObject = createAuditObject(
                user_id,
                module || 'forms',
                'FORM_UPDATE',
                "UPDATE",
                userId || `${payload?.type || ''}:${payload?.subtype || ''}`,
                payload,
                changedFields,
                jiraLink
            );
            
            await logAudit({
                ...auditErrorObject,
                status: "FAILURE",
                response_payload: JSON.stringify({
                    message: (error as any).message || "Unknown error"
                }),
                message: "Form data update failed",
            });
        } catch (auditError) {
            logger.error("Failed to log audit for failed form update: " + auditError);
        }
        
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

