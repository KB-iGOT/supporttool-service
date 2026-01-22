import apiClient from './apiClient';

export interface TicketDetails {
    id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    assignee?: any;
    contact?: any;
    dueDate?: string;
    responseDueDate?: string;
    closedTime?: string;
    createdTime?: string;
    modifiedTime?: string;
    department?: any;
    channel?: string;
    description?: string;
    webUrl?: string;
    [key: string]: any;
}

export interface ThreadMessage {
    id: string;
    direction: string;
    content: string;
    contentType: string;
    isForward: boolean;
    channel: string;
    author?: any;
    createdTime: string;
    [key: string]: any;
}

export interface TicketConversation {
    data: ThreadMessage[];
    [key: string]: any;
}

class ZohoService {
    /**
     * Fetch ticket details by ticket ID
     */
    async getTicketDetails(ticketId: string): Promise<TicketDetails> {
        try {
            const response = await apiClient.get(`/zoho/tickets/${ticketId}`);
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching ticket details:', error);
            throw error;
        }
    }

    /**
     * Fetch ticket conversation/thread
     */
    async getTicketConversation(ticketId: string): Promise<TicketConversation> {
        try {
            const response = await apiClient.get(`/zoho/tickets/${ticketId}/conversation`);
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching ticket conversation:', error);
            throw error;
        }
    }

    /**
     * Fetch all ticket threads
     */
    async getAllTicketThreads(ticketId: string): Promise<any> {
        try {
            const response = await apiClient.get(`/zoho/tickets/${ticketId}/threads`);
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching ticket threads:', error);
            throw error;
        }
    }

    /**
     * Fetch content for a specific thread
     */
    async getThreadContent(ticketId: string, threadId: string): Promise<any> {
        try {
            const response = await apiClient.get(`/zoho/tickets/${ticketId}/threads/${threadId}`);
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching thread content:', error);
            throw error;
        }
    }

    /**
     * Fetch all threads with their full content
     */
    async getAllThreadsWithContent(ticketId: string): Promise<ThreadMessage[]> {
        try {
            // First get all threads
            const threadsData = await this.getAllTicketThreads(ticketId);
            const threads = threadsData?.data || [];

            if (!threads.length) {
                return [];
            }

            // Fetch content for each thread in parallel
            const threadsWithContent = await Promise.all(
                threads.map(async (thread: any) => {
                    try {
                        const content = await this.getThreadContent(ticketId, thread.id);
                        return { ...thread, ...content };
                    } catch (err) {
                        console.warn(`Failed to fetch content for thread ${thread.id}:`, err);
                        return thread; // Return thread without content if fetch fails
                    }
                })
            );

            // Sort by createdTime, latest first
            return threadsWithContent.sort((a, b) => {
                const dateA = new Date(a.createdTime || 0).getTime();
                const dateB = new Date(b.createdTime || 0).getTime();
                return dateB - dateA;
            });
        } catch (error: any) {
            console.error('Error fetching threads with content:', error);
            throw error;
        }
    }

    /**
     * Refresh Zoho access token
     */
    async refreshToken(): Promise<any> {
        try {
            const response = await apiClient.post('/zoho/token/refresh');
            return response.data;
        } catch (error: any) {
            console.error('Error refreshing token:', error);
            throw error;
        }
    }

    /**
     * Fetch form fields and dropdown options
     */
    async getFormFields(layoutId: string = '120349000000011350'): Promise<any> {
        try {
            const response = await apiClient.get('/zoho/form-fields', {
                params: { layoutId }
            });
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching form fields:', error);
            throw error;
        }
    }

    /**
     * Update ticket properties
     */
    async updateTicket(ticketId: string, payload: any): Promise<any> {
        try {
            const response = await apiClient.patch(`/zoho/tickets/${ticketId}`, payload);
            return response.data;
        } catch (error: any) {
            console.error('Error updating ticket:', error);
            throw error;
        }
    }

    /**
     * Fetch ticket history/audit trail
     */
    async getTicketHistory(ticketId: string, from: number = 1, limit: number = 30): Promise<HistoryEvent[]> {
        try {
            const response = await apiClient.get(`/zoho/tickets/${ticketId}/history`, {
                params: { from, limit }
            });
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching ticket history:', error);
            throw error;
        }
    }

    /**
     * Fetch AI-generated ticket summary
     */
    async getTicketSummary(ticketId: string, conversationCount: number = 30): Promise<any> {
        try {
            const response = await apiClient.post(`/zoho/tickets/${ticketId}/summary`, {
                ticketId,
                type: 'TICKET',
                conversationCount,
                include: ['INCOMING', 'OUTGOING', 'FORWARDED', 'PUBLIC_COMMENTS', 'PRIVATE_COMMENTS']
            });
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching ticket summary:', error);
            throw error;
        }
    }

    /**
     * Fetch active agents for ticket assignment
     */
    async getAgents(departmentId?: string): Promise<any> {
        try {
            const response = await apiClient.get('/zoho/agents', {
                params: departmentId ? { departmentId } : {}
            });
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching agents:', error);
            throw error;
        }
    }

    /**
     * Fetch article/reply suggestions for a ticket
     */
    async getArticleSuggestions(ticketId: string, departmentId?: string, from: number = 0, limit: number = 15): Promise<any> {
        try {
            const response = await apiClient.get(`/zoho/tickets/${ticketId}/suggestions`, {
                params: { departmentId, from, limit }
            });
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching article suggestions:', error);
            throw error;
        }
    }

    /**
     * Send a reply to a ticket
     */
    async sendReply(ticketId: string, replyData: any): Promise<any> {
        try {
            const response = await apiClient.post(`/zoho/tickets/${ticketId}/reply`, replyData);
            return response.data;
        } catch (error: any) {
            console.error('Error sending reply:', error);
            throw error;
        }
    }
}

export interface HistoryEvent {
    name: string;
    eventTime: string;
    webLabel: string;
    agentId?: string;
    agentName?: string;
    changes?: Array<{
        field: string;
        fieldType: string;
        newValue?: string;
        oldValue?: string;
    }>;
    slaName?: string;
    customFunctionName?: string;
    ruleName?: string;
    recipients?: string;
    notificationType?: string;
    executionType?: string;
    assignmentType?: string;
}

export default new ZohoService();

