import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import session from 'express-session';
import { check, validationResult } from 'express-validator';
import pool from "./config/database";

import PgSession from "connect-pg-simple";
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

const pgsession = PgSession(session);



const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());
app.use(cors());

app.use(
  session({
      store: new pgsession({
          pool,
          tableName: "sessions",
          createTableIfMissing: true, // Automatically create the table if it doesn't exist
          schemaName: "public", // Specify schema if needed
      }),
      secret: "f4be817d-845f-4057-b72c-96f48896502f",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 }
  })
);

// Ensure the sessions table has the required structure
const createSessionsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar NOT NULL COLLATE "default" PRIMARY KEY,
        user_id VARCHAR(50),
        session_data JSON NOT NULL,
        expire timestamp(6) NOT NULL
      );
    `);
    console.log("✅ Sessions table is ready!");
  } catch (error) {
    console.error("❌ Error creating sessions table:", error);
  }
};
createSessionsTable();

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

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
    console.log("✅ Users table is ready!");
  } catch (error) {
    console.error("❌ Error creating table:", error);
  }
};
createTable();

require('./routes/clientRoutes.js')(app, isAuthenticated);

app.use('/api/auth', authRoutes);
app.use("/api/support-users", supportUserRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/channels", channelsRoutes);
app.use("/api/contents", ContentsRoutes);
app.use("/api/users", UsersRoutes);
app.use("/api/forms", FormsRoutes);

app.use("/api/system/settings", SystemSettingsRoutes);

app.get('*', (req, res) => {
  res.redirect("/login");
});

app.use(function(err: any, req: any, res: any, next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // add this line to include winston logging
  // winston.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // render the error page
  res.status(err.status || 500);
  res.json({'error':err.message});
});

const port = process.env.PORT || '5000';

// Set port
app.set('port', port);

const server = http.createServer(app);
server.listen(port, () =>   console.log(`🚀 Server running on http://localhost:${port}`));

// Exposing an app
module.exports = app;