import pool from "../config/database";

export const userSession = async (
    req: any,
    res: any,
    next: any
) => {
    const header = req.headers;
    const userId = header['x-user-id'];
    try {

    console.log("Fetching user session...", userId);
        const result = await pool.query('SELECT * FROM sessions WHERE user_id = $1', [userId]);
        if (result.rows.length > 0) {
            req.user = result.rows[0];
            next();
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error fetching user session:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};