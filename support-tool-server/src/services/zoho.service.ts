import axios from 'axios';
import logger from '../utils/logger';

interface ZohoTokenResponse {
    access_token: string;
    expires_in: number;
    api_domain: string;
    token_type: string;
}

class ZohoService {
    private accessToken: string;
    private refreshToken: string;
    private clientId: string;
    private clientSecret: string;
    private orgId: string;
    private portalName: string = 'karmayogibharat';
    private baseUrl: string = 'https://desk.zoho.in/api';
    private isRefreshing: boolean = false;

    constructor() {
        this.accessToken = process.env.ZOHO_ACCESS_TOKEN?.replace(/'/g, '') || '';
        this.refreshToken = process.env.ZOHO_REFRESH_TOKEN?.replace(/'/g, '') || '';
        this.clientId = process.env.ZOHO_CLIENT_ID || '';
        this.clientSecret = process.env.ZOHO_CLIENT_SECRET || '';
        this.orgId = process.env.ZOHO_ORG_ID?.replace(/'/g, '') || '';
        this.portalName = process.env.ZOHO_PORTAL_NAME || 'karmayogibharat';

        logger.info(`🔧 Zoho Service initialized - Portal: ${this.portalName}, OrgID: ${this.orgId}`);
    }

    /**
     * Refresh the access token using the refresh token
     */
    async refreshAccessToken(): Promise<string> {
        // Prevent multiple simultaneous refresh attempts
        if (this.isRefreshing) {
            logger.info('⏳ Token refresh already in progress, waiting...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.accessToken;
        }

        this.isRefreshing = true;
        try {
            const response = await axios.post<ZohoTokenResponse>(
                'https://accounts.zoho.in/oauth/v2/token',
                null,
                {
                    params: {
                        refresh_token: this.refreshToken,
                        client_id: this.clientId,
                        client_secret: this.clientSecret,
                        grant_type: 'refresh_token',
                    },
                }
            );

            this.accessToken = response.data.access_token;
            logger.info('✅ Zoho access token refreshed successfully');
            return this.accessToken;
        } catch (error: any) {
            logger.error(`❌ Failed to refresh Zoho token: ${error.message}`);
            if (error.response) {
                logger.error(`Refresh token response: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error('Failed to refresh Zoho access token');
        } finally {
            this.isRefreshing = false;
        }
    }

    /**
     * Get ticket details with all properties
     */
    async getTicketDetails(ticketId: string, retryCount: number = 0): Promise<any> {
        try {
            // Try standard API format first
            const url = `${this.baseUrl}/v1/tickets/${ticketId}`;
            const params = {
                include: 'secondaryContacts,departments,contacts,products,assignee,team,contract,source,skills,isRead',
            };

            logger.info(`📞 Fetching ticket details - URL: ${url}`);
            logger.info(`📞 Using OrgID: ${this.orgId}`);

            const response = await axios.get(url, {
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json',
                    'orgId': this.orgId,
                    'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                },
                params,
            });

            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401 && retryCount < 1) {
                // Token expired, refresh and retry
                logger.info('🔄 Token expired, refreshing...');
                await this.refreshAccessToken();
                return this.getTicketDetails(ticketId, retryCount + 1);
            }

            logger.error(`❌ Failed to fetch ticket details: ${error.message}`);
            if (error.response) {
                logger.error(`Response status: ${error.response.status}`);
                logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Get ticket conversation/thread using latestThread endpoint
     */
    async getTicketConversation(ticketId: string, retryCount: number = 0): Promise<any> {
        try {
            // Use supportapi latestThread endpoint for better conversation data
            const url = `https://desk.zoho.in/supportapi/zd/${this.portalName}/api/v1/tickets/${ticketId}/latestThread`;

            logger.info(`📞 Fetching ticket conversation - URL: ${url}`);

            const response = await axios.get(url, {
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json',
                    'orgid': this.orgId,
                    'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                },
                params: {
                    needPublic: false
                }
            });

            logger.info(`✅ Conversation fetched successfully`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401 && retryCount < 1) {
                // Token expired, refresh and retry
                logger.info('🔄 Token expired, refreshing...');
                await this.refreshAccessToken();
                return this.getTicketConversation(ticketId, retryCount + 1);
            }

            logger.error(`❌ Failed to fetch ticket conversation: ${error.message}`);
            if (error.response) {
                logger.error(`Response status: ${error.response.status}`);
                logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Get all conversations/threads for a ticket
     */
    async getAllTicketThreads(ticketId: string, retryCount: number = 0): Promise<any> {
        try {
            const url = `${this.baseUrl}/${this.portalName}/api/v1/tickets/${ticketId}/threads`;

            const response = await axios.get(url, {
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json',
                    'orgid': this.orgId,
                    'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                },
            });

            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401 && retryCount < 1) {
                // Token expired, refresh and retry
                logger.info('🔄 Token expired, refreshing...');
                await this.refreshAccessToken();
                return this.getAllTicketThreads(ticketId, retryCount + 1);
            }

            logger.error(`❌ Failed to fetch all ticket threads: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get form fields and dropdown options by layout ID
     */
    async getFormFields(layoutId: string = '120349000000011350', retryCount: number = 0): Promise<any> {
        try {
            const url = `https://desk.zoho.in/supportapi/zd/${this.portalName}/api/v1/myForm`;

            logger.info(`📞 Fetching form fields - URL: ${url}?layoutId=${layoutId}`);

            const response = await axios.get(url, {
                headers: {
                    'accept': '*/*',
                    'accept-language': 'en-US,en-IN;q=0.9,en;q=0.8,ta;q=0.7',
                    'content-type': 'application/json',
                    'orgid': this.orgId,
                    'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                },
                params: {
                    layoutId: layoutId,
                },
            });

            logger.info(`✅ Form fields fetched successfully`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401 && retryCount < 1) {
                // Token expired, refresh and retry
                logger.info('🔄 Token expired, refreshing...');
                await this.refreshAccessToken();
                return this.getFormFields(layoutId, retryCount + 1);
            }

            logger.error(`❌ Failed to fetch form fields: ${error.message}`);
            if (error.response) {
                logger.error(`Response status: ${error.response.status}`);
                logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Update ticket properties using standard Zoho Desk API
     * Uses PATCH endpoint which works with OAuth token
     */
    async updateTicket(ticketId: string, payload: any, retryCount: number = 0): Promise<any> {
        try {
            // Use standard Zoho Desk API PATCH endpoint (not batchCall which requires CSRF)
            const url = `${this.baseUrl}/v1/tickets/${ticketId}`;

            logger.info(`📞 Updating ticket ${ticketId} - URL: ${url}`);
            logger.info(`📝 Payload: ${JSON.stringify(payload)}`);

            const response = await axios.patch(url, payload, {
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json',
                    'orgId': this.orgId,
                    'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                },
            });

            logger.info(`✅ Ticket ${ticketId} updated successfully`);
            logger.info(`📝 Response: ${JSON.stringify(response.data)}`);
            return response.data;
        } catch (error: any) {
            logger.error(`❌ Update ticket error: ${error.message}`);
            if (error.response) {
                logger.error(`Response status: ${error.response.status}`);
                logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }

            if (error.response?.status === 401 && retryCount < 1) {
                // Token expired, refresh and retry (only once)
                logger.info('🔄 Token expired, refreshing...');
                await this.refreshAccessToken();
                return this.updateTicket(ticketId, payload, retryCount + 1);
            }

            throw error;
        }
    }

    /**
     * Get ticket history/audit trail
     */
    async getTicketHistory(ticketId: string, from: number = 1, limit: number = 30, retryCount: number = 0): Promise<any> {
        try {
            const url = `https://desk.zoho.in/supportapi/zd/${this.portalName}/api/v1/tickets/${ticketId}/history`;

            logger.info(`📞 Fetching ticket history - URL: ${url}`);

            const response = await axios.get(url, {
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json',
                    'orgid': this.orgId,
                    'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                    'featureflags': 'multiLayout,agentDeptOpt,pvtThread,ticketTeam,commentAttachment,spamDetails,taskReminder,showI18NFields,onholdTicketStatus,Blueprint,timeTracking,sharedDepartments,secondaryContacts,truncateContent,customChannels,apiName,blockQuoteContent,reactChanges,newHistoryFormat,getVisitorInfo,sanitizedName,sanitizedDeptNameOpt,handleClosedStatusPermission,providePHIDetails,contact,showIsNested,requestFromNewClient',
                },
                params: {
                    from,
                    limit,
                },
            });

            logger.info(`✅ Ticket history fetched successfully - ${response.data?.length || 0} events`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401 && retryCount < 1) {
                // Token expired, refresh and retry
                logger.info('🔄 Token expired, refreshing...');
                await this.refreshAccessToken();
                return this.getTicketHistory(ticketId, from, limit, retryCount + 1);
            }

            logger.error(`❌ Failed to fetch ticket history: ${error.message}`);
            if (error.response) {
                logger.error(`Response status: ${error.response.status}`);
                logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Get AI-generated ticket summary from Zoho Zia
     */
    async getTicketSummary(
        ticketId: string,
        conversationCount: number = 30,
        type: string = 'TICKET',
        include: string[] = ['INCOMING', 'OUTGOING', 'FORWARDED', 'PUBLIC_COMMENTS', 'PRIVATE_COMMENTS'],
        retryCount: number = 0
    ): Promise<any> {
        try {
            const url = `https://desk.zoho.in/supportapi/zd/${this.portalName}/api/v1/ziagpt/tickets/summary`;

            logger.info(`📞 Fetching ticket summary - URL: ${url}`);

            const response = await axios.post(url, {
                ticketId,
                type,
                conversationCount,
                include
            }, {
                headers: {
                    'accept': '*/*',
                    'content-type': 'application/json',
                    'orgid': this.orgId,
                    'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
                    'featureflags': 'multiLayout,agentDeptOpt,pvtThread,ticketTeam,commentAttachment,spamDetails,taskReminder,showI18NFields,onholdTicketStatus,Blueprint,timeTracking,sharedDepartments,secondaryContacts,truncateContent,customChannels,apiName,blockQuoteContent,reactChanges,newHistoryFormat,getVisitorInfo,sanitizedName,sanitizedDeptNameOpt,handleClosedStatusPermission,providePHIDetails,contact,showIsNested,requestFromNewClient',
                },
            });

            logger.info(`✅ Ticket summary fetched successfully`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401 && retryCount < 1) {
                // Token expired, refresh and retry
                logger.info('🔄 Token expired, refreshing...');
                await this.refreshAccessToken();
                return this.getTicketSummary(ticketId, conversationCount, type, include, retryCount + 1);
            }

            logger.error(`❌ Failed to fetch ticket summary: ${error.message}`);
            if (error.response) {
                logger.error(`Response status: ${error.response.status}`);
                logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }
}

export default new ZohoService();
