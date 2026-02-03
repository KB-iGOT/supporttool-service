import { RequestHandler, Response } from 'express';
import zohoService from '../services/zoho.service';
import logger from '../utils/logger';

/**
 * Get ticket details by ticket ID
 */
export const getTicketDetails: RequestHandler = async (req: any, res: Response) => {
    try {
        const { ticketId } = req.params;

        if (!ticketId) {
            res.status(400).json({
                success: false,
                message: 'Ticket ID is required',
            });
            return;
        }

        const ticketDetails = await zohoService.getTicketDetails(ticketId);

        res.status(200).json({
            success: true,
            data: ticketDetails,
        });
    } catch (error: any) {
        logger.error(`Error fetching ticket details: ${error.message}`);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message || 'Failed to fetch ticket details',
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Get ticket conversation/latest thread
 */
export const getTicketConversation: RequestHandler = async (req: any, res: Response) => {
    try {
        const { ticketId } = req.params;

        if (!ticketId) {
            res.status(400).json({
                success: false,
                message: 'Ticket ID is required',
            });
            return;
        }

        const conversation = await zohoService.getTicketConversation(ticketId);

        res.status(200).json({
            success: true,
            data: conversation,
        });
    } catch (error: any) {
        logger.error(`Error fetching ticket conversation: ${error.message}`);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message || 'Failed to fetch ticket conversation',
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Get all ticket threads
 */
export const getAllTicketThreads: RequestHandler = async (req: any, res: Response) => {
    try {
        const { ticketId } = req.params;

        if (!ticketId) {
            res.status(400).json({
                success: false,
                message: 'Ticket ID is required',
            });
            return;
        }

        const threads = await zohoService.getAllTicketThreads(ticketId);

        res.status(200).json({
            success: true,
            data: threads,
        });
    } catch (error: any) {
        logger.error(`Error fetching ticket threads: ${error.message}`);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message || 'Failed to fetch ticket threads',
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Get content for a specific thread
 */
export const getThreadContent: RequestHandler = async (req: any, res: Response) => {
    try {
        const { ticketId, threadId } = req.params;

        if (!ticketId || !threadId) {
            res.status(400).json({
                success: false,
                message: 'Ticket ID and Thread ID are required',
            });
            return;
        }

        const threadContent = await zohoService.getThreadContent(ticketId, threadId);

        res.status(200).json({
            success: true,
            data: threadContent,
        });
    } catch (error: any) {
        logger.error(`Error fetching thread content: ${error.message}`);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message || 'Failed to fetch thread content',
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Get active agents for ticket assignment
 */
export const getAgents: RequestHandler = async (req: any, res: Response) => {
    try {
        const { departmentId } = req.query;

        const agents = await zohoService.getAgents(departmentId as string);

        res.status(200).json({
            success: true,
            data: agents,
        });
    } catch (error: any) {
        logger.error(`Error fetching agents: ${error.message}`);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message || 'Failed to fetch agents',
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Get article/reply suggestions for a ticket
 */
export const getArticleSuggestions: RequestHandler = async (req: any, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { departmentId, from, limit } = req.query;

        if (!ticketId) {
            res.status(400).json({
                success: false,
                message: 'Ticket ID is required',
            });
            return;
        }

        const suggestions = await zohoService.getArticleSuggestions(
            ticketId as string,
            departmentId as string,
            from ? parseInt(from as string) : 0,
            limit ? parseInt(limit as string) : 15
        );

        res.status(200).json({
            success: true,
            data: suggestions,
        });
    } catch (error: any) {
        logger.error(`Error fetching article suggestions: ${error.message}`);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message || 'Failed to fetch article suggestions',
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Refresh Zoho access token
 */
export const refreshToken: RequestHandler = async (req: any, res: Response) => {
    try {
        const newToken = await zohoService.refreshAccessToken();

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: { accessToken: newToken },
        });
    } catch (error: any) {
        logger.error(`Error refreshing token: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh token',
            error: error.message,
        });
    }
};

/**
 * Get form fields and dropdown options
 */
export const getFormFields: RequestHandler = async (req: any, res: Response) => {
    try {
        const { layoutId } = req.query;

        const formFields = await zohoService.getFormFields(layoutId as string);

        res.status(200).json({
            success: true,
            data: formFields,
        });
    } catch (error: any) {
        logger.error(`Error fetching form fields: ${error.message}`);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message || 'Failed to fetch form fields',
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Update ticket properties
 */
export const updateTicket: RequestHandler = async (req: any, res: Response) => {
    try {
        const { ticketId } = req.params;
        const payload = req.body;

        if (!ticketId) {
            res.status(400).json({
                success: false,
                message: 'Ticket ID is required',
            });
            return;
        }

        logger.info(`📝 Updating ticket ${ticketId} with payload: ${JSON.stringify(payload)}`);

        const result = await zohoService.updateTicket(ticketId, payload);

        res.status(200).json({
            success: true,
            message: 'Ticket updated successfully',
            data: result,
        });
    } catch (error: any) {
        logger.error(`Error updating ticket: ${error.message}`);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message || 'Failed to update ticket',
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Get ticket history/audit trail
 */
export const getTicketHistory: RequestHandler = async (req: any, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { from = 1, limit = 30 } = req.query;

        if (!ticketId) {
            res.status(400).json({
                success: false,
                message: 'Ticket ID is required',
            });
            return;
        }

        const history = await zohoService.getTicketHistory(
            ticketId,
            parseInt(from as string, 10),
            parseInt(limit as string, 10)
        );

        res.status(200).json({
            success: true,
            data: history,
        });
    } catch (error: any) {
        logger.error(`Error fetching ticket history: ${error.message}`);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message || 'Failed to fetch ticket history',
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Get AI-generated ticket summary
 */
export const getTicketSummary: RequestHandler = async (req: any, res: Response) => {
    try {
        const { ticketId } = req.params;
        const { conversationCount = 30, type = 'TICKET', include } = req.body;

        if (!ticketId) {
            res.status(400).json({
                success: false,
                message: 'Ticket ID is required',
            });
            return;
        }

        const summary = await zohoService.getTicketSummary(
            ticketId,
            parseInt(conversationCount as string, 10),
            type,
            include
        );

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error: any) {
        logger.error(`Error fetching ticket summary: ${error.message}`);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message || 'Failed to fetch ticket summary',
            error: error.response?.data || error.message,
        });
    }
};

/**
 * Send a reply to a ticket
 */
export const sendReply: RequestHandler = async (req: any, res: Response) => {
    try {
        const { ticketId } = req.params;
        const replyData = req.body;

        if (!ticketId) {
            res.status(400).json({
                success: false,
                message: 'Ticket ID is required',
            });
            return;
        }

        if (!replyData.content) {
            res.status(400).json({
                success: false,
                message: 'Reply content is required',
            });
            return;
        }

        const result = await zohoService.sendReply(ticketId, replyData);

        res.status(200).json({
            success: true,
            data: result,
            message: 'Reply sent successfully'
        });
    } catch (error: any) {
        logger.error(`Error sending reply: ${error.message}`);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.message || 'Failed to send reply',
            error: error.response?.data || error.message,
        });
    }
};
