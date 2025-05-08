import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import session from 'express-session';
import { check, validationResult } from 'express-validator';
import pool from "./config/database";
import logger from "./utils/logger";

import connectPgSimple from "connect-pg-simple";
import {isAuthenticated} from './helpers/sessionValidator';

import authRoutes from './routes/authentication.routes';
import supportUserRoutes from "./routes/support-user.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import moduleRoutes from './routes/modules.routes';
import channelsRoutes from './routes/channels.routes';
import ContentsRoutes  from "./routes/contents.routes";
import UsersRoutes from "./routes/users.routes";
import FormsRoutes from "./routes/forms.routes";
import SystemSettingsRoutes from "./routes/systems-settings.routes";
import organisationsRoutes from "./routes/organisations.routes";
import clientRoutes from "./helpers/clientRoutes";
// import { connectCassandra } from "./utils/cassandra";


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['https://support.uat.karmayogibharat.net',`http://${process.env.HOST}:3000`]; // Add your allowed origins here
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true                  // <-- allow cookies, auth headers
}));

const PgSession = connectPgSimple(session);
const pgPool = pool;

const store = new PgSession({ pool: pgPool, tableName: 'sessions' });

// Monkey-patch the set() method to also update token/user_id
const originalSet = store.set.bind(store);
store.set = (sid: any, sess: any, callback: (arg0: unknown) => void) => {
  originalSet(sid, sess, async (err: any) => {
    if (err) return callback?.(err);

    const token = sess.user.token || null;
    const userId = sess.user.id || null;

    try {
      await pgPool.query(
        'UPDATE sessions SET token = $1, user_id = $2 WHERE sid = $3',
        [token, userId, sid]
      );
      callback?.(null);
    } catch (dbErr) {
      console.error('Failed to sync token/userId:', dbErr);
      callback?.(dbErr);
    }
  });
};

app.use(
  session({
    store,
    secret: 'f4be817d-845f-4057-b72c-96f48896502f',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false,
      secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Ensure the sessions table has the required structure
const createSessionsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar NOT NULL COLLATE "default" PRIMARY KEY,
        expire timestamp(6) NOT NULL,
        sess JSON NOT NULL,
        userId varchar
      );
    `);
    logger.info("✅ Sessions table is ready!");
  } catch (error) {
    logger.error(`❌ Error creating sessions table: ${error}`);
  }
};

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  const allowedOrigins = ['https://support.uat.karmayogibharat.net',`http://${process.env.HOST}:3000`]  // Add your allowed origins here
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-authenticated-user-token, authorization');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Pass to next layer of middleware
  next();
});

// app.use(morgan('combined', { stream: logger.stream }));

// 🚀 **Create users table if not exists**
const createTable = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                "userId" VARCHAR(50) UNIQUE NOT NULL,
                "userName" VARCHAR(100) UNIQUE NOT NULL,
                "firstName" VARCHAR(100) NOT NULL,
                "lastName" VARCHAR(100) NOT NULL,
                roles TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now()
            );
        `);
    logger.info("✅ Users table is ready!");
  } catch (error) {
    logger.error(`❌ Error creating table: ${error}`);
  }
};

clientRoutes(app, isAuthenticated);

app.use('/v1/auth', authRoutes);
app.use("/v1/support-users", supportUserRoutes);
app.use("/v1/dashboard", dashboardRoutes);
app.use("/v1/modules", moduleRoutes);
app.use("/v1/channels", channelsRoutes);
app.use("/v1/contents", ContentsRoutes);
app.use("/v1/users", UsersRoutes);
app.use("/v1/forms", FormsRoutes);
app.use("/v1/org", organisationsRoutes);

app.use("/v1/system/settings", SystemSettingsRoutes);

app.get('*', (req, res) => {
  res.redirect("/login");
});


const port = parseInt(process.env.PORT || '5000', 10); // Ensure port is a number


// Set port
app.set('port', port);


const server = http.createServer(app);
const startServer = async () => {
  try {
    // Wait for database connections
    await createTable();
    await createSessionsTable();
    // await connectCassandra();

    // Start the server
    const host = process.env.HOST || '192.168.1.100'; // Replace with your desired IP
    server.listen(port, host, () => {
      logger.info(`🚀 Server running on http://${host}:${port}`);
    });
  } catch (error) {
    logger.error(`❌ Failed to start server: ${error}`);
    process.exit(1); // Exit with error code
  }
};
startServer();
 

// Exposing an app
module.exports = app;