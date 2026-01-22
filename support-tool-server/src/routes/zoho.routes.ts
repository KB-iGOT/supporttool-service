import { Router, Request, Response } from 'express';
import axios from 'axios';
import { getTicketDetails, getTicketConversation, getAllTicketThreads, refreshToken, getFormFields, updateTicket, getTicketHistory, getTicketSummary } from '../controllers/zoho.controller';

const router = Router();

// Get ticket details
router.get('/tickets/:ticketId', getTicketDetails);

// Get ticket conversation (latest thread)
router.get('/tickets/:ticketId/conversation', getTicketConversation);

// Get all ticket threads
router.get('/tickets/:ticketId/threads', getAllTicketThreads);

// Get ticket history
router.get('/tickets/:ticketId/history', getTicketHistory);

// Get AI-generated ticket summary
router.post('/tickets/:ticketId/summary', getTicketSummary);

// Update ticket properties
router.patch('/tickets/:ticketId', updateTicket);

// Get form fields and dropdown options
router.get('/form-fields', getFormFields);

// Refresh access token
router.post('/token/refresh', refreshToken);

// OAuth callback - automatically exchanges code for tokens
router.get('/oauth/callback', async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code) {
        res.status(400).send('No authorization code provided');
        return;
    }

    try {
        const response = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, {
            params: {
                code: code as string,
                client_id: process.env.ZOHO_CLIENT_ID,
                client_secret: process.env.ZOHO_CLIENT_SECRET,
                redirect_uri: 'http://localhost:5000/api/zoho/oauth/callback',
                grant_type: 'authorization_code'
            }
        });

        const { access_token, refresh_token, expires_in } = response.data;

        res.send(`
            <html>
            <head><title>OAuth Success</title></head>
            <body style="font-family: Arial; padding: 40px; background: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #28a745;">✅ OAuth Success!</h1>
                    <p><strong>Copy this refresh token to your .env file:</strong></p>
                    <textarea style="width: 100%; height: 100px; font-family: monospace; padding: 10px;">${refresh_token}</textarea>
                    <p style="color: #666; margin-top: 20px;">
                        Update ZOHO_REFRESH_TOKEN in your .env file and restart the server.
                    </p>
                    <hr>
                    <p><small>Access Token (expires in ${expires_in}s): ${access_token?.substring(0, 50)}...</small></p>
                </div>
            </body>
            </html>
        `);
    } catch (error: any) {
        console.error('OAuth error:', error.response?.data || error.message);
        res.status(500).send(`
            <html>
            <body style="font-family: Arial; padding: 40px;">
                <h1 style="color: #dc3545;">❌ OAuth Error</h1>
                <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
                <p><a href="javascript:history.back()">Go back and try again</a></p>
            </body>
            </html>
        `);
    }
});

export default router;


