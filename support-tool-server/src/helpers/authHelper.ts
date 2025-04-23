import pool from "../config/database";

export const userSession = async (
    req: any,
    res: any,
    next: any
) => {
    const header = req.headers;
    const userId = header['x-user-id'];
    try {
        const result = await pool.query('SELECT * FROM sessions WHERE user_id = $1', [userId]);
        if (result.rows.length > 0) {
            next();
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error fetching user session:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};