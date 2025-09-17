import { Request, Response, RequestHandler } from "express";
import axios from "axios";
import logger from "../utils/logger";

const createApiHeaders = (token?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: process.env.AUTHORIZATION || "",
      "x-authenticated-user-token": token?.trim()|| "",
    };
    
    return headers;
};

const handleApiError = (error: any, res: Response, logMessage: string) => {
    logger.error(`❌ ${logMessage}: ${error}`);
    if (axios.isAxiosError(error) && error.response) {
        res.status(error.response.status).json({
            message: `Error from upstream API: ${logMessage}`,
            error: error.response.data,
        });
    } else {
        res.status(500).send({
            message: "Internal server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
};

export const searchCompetencyThemes: RequestHandler = async (req: any, res: Response) => {
    const logMessage = "Error searching competency themes";
    logger.info(`Searching for competency themes with body: ${JSON.stringify(req.body)}`);

    try {
        const response = await axios({
            method: "POST",
            url: `${process.env.KONG_API_URL}/api/competencyTheme/search`,
            headers: createApiHeaders(req.user.token),
            data: req.body,
        });

        logger.info(`Successfully fetched competency themes`);
        res.status(200).send(response.data);
    } catch (error) {
        handleApiError(error, res, logMessage);
    }
};

export const searchCompetencySubThemes: RequestHandler = async (req: any, res: Response) => {
    const logMessage = "Error searching competency sub-themes";
    logger.info(`Searching for competency sub-themes with body: ${JSON.stringify(req.body)}`);

    try {
        const response = await axios({
            method: "POST",
            url: `${process.env.KONG_API_URL}/api/competencySubTheme/search`,
            headers: createApiHeaders(req.user.token),
            data: req.body,
        });

        logger.info(`Successfully fetched competency sub-themes`);
        res.status(200).send(response.data);
    } catch (error) {
        handleApiError(error, res, logMessage);
    }
};

export const createCompetencyTheme: RequestHandler = async (req: any, res: Response) => {
    const logMessage = "Error creating competency theme";
    logger.info(`Creating competency theme with body: ${JSON.stringify(req.body)}`);

    try {
        const response = await axios({
            method: "POST",
            url: `${process.env.KONG_API_URL}/api/competencyTheme/create`,
            headers: createApiHeaders(req.user.token),
            data: req.body,
        });

        logger.info(`Successfully created competency theme`);
        res.status(200).send(response.data);
    } catch (error) {
        handleApiError(error, res, logMessage);
    }
};

export const createCompetencySubTheme: RequestHandler = async (req: any, res: Response) => {
    const logMessage = "Error creating competency sub-theme";
    logger.info(`Creating competency sub-theme with body: ${JSON.stringify(req.body)}`);

    try {
        const response = await axios({
            method: "POST",
            url: `${process.env.KONG_API_URL}/api/competencySubTheme/create`,
            headers: createApiHeaders(req.user.token),
            data: req.body,
        });

        logger.info(`Successfully created competency sub-theme`);
        res.status(200).send(response.data);
    } catch (error) {
        handleApiError(error, res, logMessage);
    }
};