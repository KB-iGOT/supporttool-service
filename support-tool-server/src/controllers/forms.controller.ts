import { Request, Response } from "express";
import { RequestHandler } from "express";
import { userSession } from "../helpers/authHelper";
import axios from "axios"; // Use axios instead of request (which is deprecated)

export const getForms: RequestHandler = async (
    req: Request,
    res: Response
) => {
    const header = req.headers;
    const userId = header['x-user-id'];
    try {
        const { session } = await userSession(userId);
        try {
            const response = await axios({
                method: 'POST',
                url: `${process.env.KONG_API_URL}/apis/v1/form/list`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': process.env.AUTHORIZATION,
                    'x-authenticated-user-token': session.session_data.token.trim(),
                },

                data: req.body, // Send the request body from client
            });

            // If successful
            res.status(200).send(response.data )
        } catch (error) {
            console.error("❌ Error fetching contents:", error);
            
            // Check if it's an axios error with response
            if ((error as any).response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const axiosError = error as any; // Explicitly cast error to any
                res.status(axiosError.response.status).json({ 
                    message: "Error from content API", 
                    error: axiosError.response.data 
                });
            } else if ((error as any).request) {
                // The request was made but no response was received
                res.status(503).json({ 
                    message: "No response from content API", 
                    error: "Service unavailable" 
                });
            } else {
                // Something happened in setting up the request that triggered an Error
                res.status(500).json({ 
                    message: "Internal server error", 
                    error: (error as any).message 
                });
            }
        }
    } catch (error: any) {
        console.error("❌ Error getting user session:", error);
        res.status(500).json({ 
            message: "Failed to authenticate user session", 
            error: error.message 
        });
    }
};
