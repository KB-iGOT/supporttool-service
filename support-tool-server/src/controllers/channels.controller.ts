import { Request, Response } from "express";
import { RequestHandler } from "express";
import request from 'request';
import { userSession } from "../helpers/authHelper";

export const fetchChannel: RequestHandler = async (
    req: any,
    res: Response
  ) => {
    const {id} = req.params;

    try {
        var options = {
            method: 'GET',
            url: `${process.env.KONG_API_URL}api/channel/v1/read/${id}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.AUTHORIZATION,
                'x-authenticated-user-token': req.user.token.trim(),
            },
            json: true
        }
    
        request(options, function (error, response, body) {
            if (error != null) {
                console.error("❌ Error fetching users:", error);
                res
                    .status(500)
                    .json({ message: "Internal server error", error: error.message });
                
            } else {
                if (!error && body) {
                    
                    if (body) {
                        res.status(200).send({ status: 200, message: 'Channel fetched successfully', channels: body });
                    } else {
                        
                        res.status(500).send({ status: 500, message: 'Internal server error' });

                    }

                } else {
                    
                    res.status(500).send({ status: 500, message: 'Internal server error' });
                }
            }
        });
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res
            .status(500)
            .json({ message: "Internal server error", error });
    }
};