import { Request, Response } from "express";
import pool from "../config/database";
import { RequestHandler } from "express";

export const userSession = async (
    req: string | string[] | undefined
  ) => {    
    try {
        const result = await pool.query('SELECT * FROM sessions WHERE user_id = $1', [req]);
        if (result.rows.length > 0) {
            return { session: result.rows[0] };
        } else {
            return { message: "User session not found" };
        }
    } catch (error) {
        console.error("Error fetching user session:", error);
        return { message: "Internal server error" };
    }
};