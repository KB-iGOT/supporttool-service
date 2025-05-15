
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectPostgres = new Pool({
    host: process.env.POSTGRES_DB_HOST,
    port: Number(process.env.POSTGRES_DB_PORT),
    user: process.env.POSTGRES_DB_USER,
    password: process.env.POSTGRES_DB_PASSWORD,
    database: process.env.POSTGRES_DB_NAME,
});

export async function connect() {
    try {
        await connectPostgres.query('select * from org_hierarchy_v4;'); // Test the connection
        console.log('Successfully connected to PostgreSQL');
    } catch (error) {
        console.error('PostgreSQL connection error:', error);
        throw error;
    }
    return connectPostgres;
}

export { connectPostgres };