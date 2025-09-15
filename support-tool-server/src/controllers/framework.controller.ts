import { Request, Response } from "express";
import { RequestHandler } from "express";
import axios from "axios";
import logger from "../utils/logger";
import logAudit from "../helpers/auditLogger";

export const fetchFramework: RequestHandler = async (
  req: any,
  res: Response
) => {
  const { id } = req.params;
  logger.info(`Fetching framework with id: ${id}`);

  try {
    const options = {
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/framework/v1/read/${id}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION
      },
    };

    const response = await axios(options);

    if (response.data) {
      logger.info(`Successfully fetched framework: ${id}`);
      res.status(200).send(response.data);
    } else {
      logger.error("Empty response body from framework API");
      res.status(500).send({ status: 500, message: "Internal server error" });
    }
  } catch (error) {
    logger.error("❌ Error in fetchFramework controller:" + error);
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({
        message: "Error from framework API",
        error: error.response.data,
      });
    } else {
      res.status(500).send({
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
};

export const updateTerm: RequestHandler = async (req: any, res: Response) => {
  const { termId } = req.params;
  const { framework, category } = req.query;
  const { requestPayload, jiraLink, module } = req.body;
  const user_id = req.headers["x-user-id"];

  const auditObject = {
    user_id,
    module: module || "FRAMEWORK_UPDATE",
    sub_module: "UPDATE_TERM_ASSOCIATIONS",
    action: "UPDATE",
    entity_id: termId,
    request_payload: requestPayload,
    modified_payload: null,
    status: "PENDING",
    message: `Attempting to update term: ${termId}`,
    jira_link: jiraLink,
  };

  try {
    logger.info(`Updating term ${termId} in framework ${framework} with payload: ${JSON.stringify(requestPayload)}`);

    const options = {
      method: "PATCH",
      url: `${process.env.KONG_API_URL}/api/framework/v1/term/update/${termId}?framework=${framework}&category=${category}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
      },
      data: requestPayload,
    };

    const response = await axios(options);

    await logAudit({ ...auditObject, status: "SUCCESS", response_payload: response.data, message: `Successfully updated term: ${termId}` });
    res.status(200).send(response.data);

  } catch (error) {
    const errorMessage = `Error updating term: ${termId}`;
    logger.error(`❌ ${errorMessage}: ${error}`);

    let errorResponse: any = { message: errorMessage, error: "Internal Server Error" };
    let statusCode = 500;

    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status;
      errorResponse = {
        message: error.response.data?.params?.errmsg || "Error from upstream API",
        error: error.response.data,
      };
    }

    await logAudit({ ...auditObject, status: "FAILURE", response_payload: errorResponse, message: errorMessage });
    res.status(statusCode).json(errorResponse);
  }
};

export const publishFramework: RequestHandler = async (req: any, res: Response) => {
  const { frameworkId } = req.params;
  const { jiraLink, orgId, module } = req.body;
  const user_id = req.headers["x-user-id"];

  const auditObject = {
    user_id,
    module: module || "FRAMEWORK_PUBLISH",
    sub_module: "PUBLISH_FRAMEWORK",
    action: "UPDATE",
    entity_id: frameworkId,
    request_payload: req.body,
    modified_payload: null,
    status: "PENDING",
    message: `Attempting to publish framework: ${frameworkId}`,
    jira_link: jiraLink,
  };

  try {
    logger.info(`Publishing framework ${frameworkId}`);

    const options = {
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/framework/v1/publish/${frameworkId}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "X-Channel-Id": orgId,
      },
      data: {}, // Upstream API expects an empty JSON object
    };

    const response = await axios(options);

    await logAudit({ ...auditObject, status: "SUCCESS", response_payload: response.data, message: `Successfully published framework: ${frameworkId}` });
    res.status(200).send(response.data);

  } catch (error) {
    const errorMessage = `Error publishing framework: ${frameworkId}`;
    logger.error(`❌ ${errorMessage}: ${error}`);

    let errorResponse: any = { message: errorMessage, error: "Internal Server Error" };
    let statusCode = 500;

    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status;
      errorResponse = {
        message: error.response.data?.params?.errmsg || "Error from upstream API",
        error: error.response.data,
      };
    }

    await logAudit({ ...auditObject, status: "FAILURE", response_payload: errorResponse, message: errorMessage });
    res.status(statusCode).json(errorResponse);
  }
};

export const updateTermV2: RequestHandler = async (req: any, res: Response) => {
  const { termId } = req.params;
  const { frameworkId, category
    
   } = req.query;
  const { newAssociations, jiraLink, module } = req.body;
  const user_id = req.headers["x-user-id"];
  let auditObject: any; // Define auditObject here to be accessible in catch block

  try {
    // 1. Fetch existing framework data
    logger.info(`Fetching framework ${frameworkId} to get existing associations for term ${termId}`);
    const fetchOptions = {
      method: "GET",
      url: `${process.env.KONG_API_URL}/api/framework/v1/read/${frameworkId}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION
      },
    };
    const frameworkResponse = await axios(fetchOptions);
    const frameworkData = frameworkResponse.data.result?.framework;

    if (!frameworkData) {
      throw new Error("Framework data not found.");
    }

    // 2. Find existing associations
    const frameworkCategory = frameworkData.categories?.find((cat: any) => cat.code === category);
    const term = frameworkCategory?.terms?.find((t: any) => t.code === termId);
    const existingAssociations = term?.associations?.map((assoc: any) => ({ identifier: assoc.identifier })) || [];
    logger.info(`Found ${existingAssociations.length} existing associations for term ${termId}`);

    // 3. Merge associations
    const allAssociations = [...existingAssociations, ...newAssociations];
    logger.info(`Total associations after merging: ${allAssociations.length}`);

    // 4. Update the term with all associations
    const updatePayload = {
      request: {
        term: {
          associations: allAssociations,
        },
      },
    };

    // 5. Create audit object with the final payload
    auditObject = {
      user_id,
      module: module || "FRAMEWORK_UPDATE",
      sub_module: "UPDATE_TERM_ASSOCIATIONS_V2",
      action: "UPDATE",
      entity_id: termId,
      request_payload: updatePayload, // Log the actual payload being sent
      modified_payload: { newAssociations }, // Log what was new
      status: "PENDING",
      message: `Attempting to update term v2: ${termId}`,
      jira_link: jiraLink,
    };

    // 6. Call the update API
    const updateOptions = {
      method: "PATCH",
      url: `${process.env.KONG_API_URL}/api/framework/v1/term/update/${termId}?framework=${frameworkId}&category=${category}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
      },
      data: updatePayload,
    };

    const updateResponse = await axios(updateOptions);

    await logAudit({ ...auditObject, status: "SUCCESS", response_payload: updateResponse.data, message: `Successfully updated term v2: ${termId}` });
    res.status(200).send(updateResponse.data);

  } catch (error) {
    const errorMessage = `Error updating term v2: ${termId}`;
    logger.error(`❌ ${errorMessage}: ${error}`);

    let errorResponse: any = { message: errorMessage, error: "Internal Server Error" };
    let statusCode = 500;

    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status;
      errorResponse = {
        message: error.response.data?.params?.errmsg || "Error from upstream API",
        error: error.response.data,
      };
    }

    // Ensure auditObject is initialized before logging failure
    if (auditObject) {
      await logAudit({ ...auditObject, status: "FAILURE", response_payload: errorResponse, message: errorMessage });
    }
    res.status(statusCode).json(errorResponse);
  }
};