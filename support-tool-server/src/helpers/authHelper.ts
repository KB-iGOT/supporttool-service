import pool from "../config/database";
import logger from "../utils/logger";

/**
 * Resolves the caller's session from the `x-user-id` header.
 *
 * A user can legitimately have more than one row here — every login creates a new
 * session — so the newest unexpired one is selected explicitly. Without the ordering
 * the database was free to return an older row, whose Keycloak token has usually
 * expired, and the upstream call then failed with 401 seemingly at random.
 */
export const userSession = async (
    req: any,
    res: any,
    next: any
) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        res.status(401).json({ status: 401, message: "Unauthorized: user id is required" });
        return;
    }

    try {
        const result = await pool.query(
            `SELECT * FROM sessions
             WHERE user_id = $1 AND expire > NOW()
             ORDER BY expire DESC
             LIMIT 1`,
            [userId]
        );

        if (result.rows.length === 0) {
            logger.warn(`No active session for user ${userId}`);
            // Answer with a status the client can act on. A redirect is meaningless
            // to the XHR calls that reach this middleware.
            res.status(401).json({ status: 401, message: "Unauthorized: no active session" });
            return;
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        logger.error(`Error fetching user session for ${userId}: ${error}`);
        res.status(500).json({ message: "Internal server error" });
    }
};
