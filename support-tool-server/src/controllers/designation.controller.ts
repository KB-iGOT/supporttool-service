import { Request, Response, RequestHandler } from "express";
import axios from "axios";
import FormData from "form-data";
import logger from "../utils/logger";
import logAudit from "../helpers/auditLogger";

export const searchDesignations: RequestHandler = async (
  req: any,
  res: Response
) => {
  logger.info(`Searching for designations with body: ${JSON.stringify(req.body)}`);

  try {
    const options = {
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/designation/search`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: req.body,
    };

    const response = await axios(options);

    if (response.data) {
      logger.info(`Successfully fetched designations`);
      res.status(200).send(response.data);
    } else {
      logger.error("Empty response body from designation search API");
      res.status(500).send({ status: 500, message: "Internal server error" });
    }
  } catch (error) {
    logger.error("❌ Error in searchDesignations controller:" + error);
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({
        message: "Error from designation API",
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

export const searchCompositeDesignations: RequestHandler = async (
  req: any,
  res: Response
) => {
  logger.info(`Searching for composite designations with body: ${JSON.stringify(req.body)}`);

  try {
    const options = {
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/composite/v4/search`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
      },
      data: req.body,
    };

    const response = await axios(options);

    if (response.data) {
      logger.info(`Successfully fetched composite designations`);
      res.status(200).send(response.data);
    } else {
      logger.error("Empty response body from composite designation search API");
      res.status(500).send({ status: 500, message: "Internal server error" });
    }
  } catch (error) {
    logger.error(`❌ Error in searchCompositeDesignations controller: ${error instanceof Error ? error.message : String(error)}`);
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({
        message: "Error from composite designation API",
        error: error.response.data,
      });
    } else {
      res.status(500).send({ message: "Internal server error", error: error instanceof Error ? error.message : String(error) });
    }
  }
};


export const createDesignation: RequestHandler = async (
  req: any,
  res: Response
) => {
  const { jiraLink, module, requestPayload } = req.body;
  const user_id = req.headers["x-user-id"];

  const auditObject = {
    user_id,
    module: module || 'DESIGNATION_IMPORT',
    sub_module: 'CREATE_DESIGNATION_TERM',
    action: 'CREATE',
    entity_id: requestPayload.code,
    request_payload: requestPayload,
    modified_payload: null,
    status: 'PENDING',
    message: `Attempting to create designation term: ${requestPayload.name}`,
    jira_link: jiraLink,
  };

  try {
    logger.info(`Creating designation term with payload: ${JSON.stringify(requestPayload)}`);

    const options = {
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/designation/create/term`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: requestPayload,
    };

    const response = await axios(options);

    await logAudit({ ...auditObject, status: 'SUCCESS', response_payload: response.data, message: `Successfully created designation term: ${requestPayload.name}` });
    res.status(200).send(response.data);

  } catch (error) {
    const errorMessage = `Error creating designation term: ${requestPayload.name}`;
    logger.error(`❌ ${errorMessage}: ${error}`);

    let errorResponse = { message: errorMessage, error: 'Internal Server Error' };
    let statusCode = 500;

    if (axios.isAxiosError(error) && error.response) {
      statusCode = error.response.status;
      errorResponse = {
        message: error.response.data?.params?.errmsg || "Error from upstream API",
        error: error.response.data,
      };
    }

    await logAudit({ ...auditObject, status: 'FAILURE', response_payload: errorResponse, message: errorMessage });
    res.status(statusCode).json(errorResponse);
  }
};

export const uploadDesignations: RequestHandler = async (
  req: any,
  res: Response
) => {
  const user_id = req.headers["x-user-id"];
  const { auditData: auditDataString } = req.body;
  const file = req.file;

  if (!file) {
    res.status(400).json({ message: "No file uploaded." });
    return;
  }

  let auditData;
  try {
    auditData = JSON.parse(auditDataString);
  } catch (e) {
    res.status(400).json({ message: "Invalid audit data format." });
    return;
  }

  const auditObject = {
    user_id,
    module: auditData.module || 'DESIGNATION_BULK_UPLOAD',
    sub_module: 'UPLOAD_CSV',
    action: 'CREATE',
    entity_id: file.originalname,
    request_payload: { fileName: file.originalname, size: file.size, ...auditData.payload },
    modified_payload: null,
    status: 'PENDING',
    message: `Attempting to upload master designations from file: ${file.originalname}`,
    jira_link: auditData.jiraLink,
  };

  try {
    logger.info(`Uploading master designations from file: ${file.originalname}`);

    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);

    const options = {
      method: "POST",
      url: `${process.env.KONG_API_URL}/api/designation/upload`,
      headers: {
        ...formData.getHeaders(),
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: formData,
    };

    const response = await axios(options);

    await logAudit({ ...auditObject, status: 'SUCCESS', response_payload: response.data, message: `Successfully uploaded designations from file: ${file.originalname}` });
    res.status(200).send({ status: 200, message: "File uploaded successfully", ...response.data });

  } catch (error) {
    const errorMessage = `Error uploading designations file: ${file.originalname}`;
    logger.error(`❌ ${errorMessage}: ${error}`);

    const errorResponse = axios.isAxiosError(error) && error.response ? error.response.data : { message: 'Internal Server Error' };

    await logAudit({ ...auditObject, status: 'FAILURE', response_payload: errorResponse, message: errorMessage });
    res.status(axios.isAxiosError(error) && error.response ? error.response.status : 500).json(errorResponse);
  }
};

export const deleteDesignation: RequestHandler = async (
  req: any,
  res: Response
) => {
  const { id } = req.params;
  const { jiraLink, module } = req.body;
  const user_id = req.headers["x-user-id"];

  const auditObject = {
    user_id,
    module: module || 'DESIGNATION_DELETE',
    sub_module: 'DELETE_DESIGNATION',
    action: 'DELETE',
    entity_id: id,
    request_payload: { id, jiraLink },
    modified_payload: null,
    status: 'PENDING',
    message: `Attempting to delete designation: ${id}`,
    jira_link: jiraLink,
  };

  try {
    logger.info(`Deleting designation with id: ${id}`);

    const options = {
      method: "DELETE",
      url: `${process.env.KONG_API_URL}/api/designation/delete/${id}`,
      headers: {
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
    };

    const response = await axios(options);

    await logAudit({ ...auditObject, status: 'SUCCESS', response_payload: response.data, message: `Successfully deleted designation: ${id}` });
    res.status(200).send(response.data);

  } catch (error) {
    const errorMessage = `Error deleting designation: ${id}`;
    logger.error(`❌ ${errorMessage}: ${error}`);

    const errorResponse = axios.isAxiosError(error) && error.response ? error.response.data : { message: 'Internal Server Error' };
    const statusCode = axios.isAxiosError(error) && error.response ? error.response.status : 500;

    await logAudit({ ...auditObject, status: 'FAILURE', response_payload: errorResponse, message: errorMessage });
    res.status(statusCode).json(errorResponse);
  }
};

export const updateDesignation: RequestHandler = async (
  req: any,
  res: Response
) => {
  const { jiraLink, module, requestPayload, payload } = req.body;
  const user_id = req.headers["x-user-id"];
  const designationId = requestPayload?.id;

  const auditObject = {
    user_id,
    module: module || 'DESIGNATION_UPDATE',
    sub_module: 'UPDATE_DESIGNATION',
    action: 'UPDATE',
    entity_id: designationId,
    request_payload: req.body,
    modified_payload: payload?.updatedData,
    status: 'PENDING',
    message: `Attempting to update designation: ${designationId}`,
    jira_link: jiraLink,
  };

  try {
    logger.info(`Updating designation with id: ${designationId}`);

    const options = {
      method: "PUT",
      url: `${process.env.KONG_API_URL}/api/designation/update`,
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.AUTHORIZATION,
        "x-authenticated-user-token": req.user.token.trim(),
      },
      data: requestPayload,
    };

    const response = await axios(options);

    await logAudit({ ...auditObject, status: 'SUCCESS', response_payload: response.data, message: `Successfully updated designation: ${designationId}` });
    res.status(200).send(response.data);

  } catch (error) {
    const errorMessage = `Error updating designation: ${designationId}`;
    logger.error(`❌ ${errorMessage}: ${error}`);

    const errorResponse = axios.isAxiosError(error) && error.response ? error.response.data : { message: 'Internal Server Error' };
    const statusCode = axios.isAxiosError(error) && error.response ? error.response.status : 500;

    await logAudit({ ...auditObject, status: 'FAILURE', response_payload: errorResponse, message: errorMessage });
    res.status(statusCode).json(errorResponse);
  }
};