import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import morgan from "morgan";
import path from "path";
import dotenv from "dotenv";
import session from 'express-session';
import { check, validationResult } from 'express-validator';
var Keycloak = require('keycloak-connect');
import pool from "./config/database";

import supportUserRoutes from "./routes/support-user.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import moduleRoutes from './routes/modules.routes';

const memoryStore = new session.MemoryStore();


let keyCloakConfig = {
  "realm": "sunbird",
  "auth-server-url": "https://portal.dev.karmayogibharat.net/auth",
  "ssl-required": "none",
  "resource": "support_igot",
  "public-client": true,
  "confidential-port": 0
}

let keyCloak = new Keycloak({ store: memoryStore }, keyCloakConfig);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());
app.use(cors());

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

// Example usage of express-validator in a route
app.post('/example-route', [
  check('username').isEmail(),
  check('password').isLength({ min: 5 })
], (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  res.send('Success');
});


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
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS modules (
//           id SERIAL PRIMARY KEY,
//           "name" VARCHAR(50) UNIQUE NOT NULL,
//           "url" VARCHAR(100) UNIQUE NOT NULL,
//           "isVisible" boolean NOT NULL,
//           roles TEXT[] NOT NULL,
//           isAdminModule boolean NOT NULL,
//           isRootModule boolean  NOT NULL,
//       );
//   `);
// console.log("✅ modules table is ready!");
  } catch (error) {
    console.error("❌ Error creating table:", error);
  }
};
createTable();

require('./routes/clientRoutes.js')(app, keyCloak);


app.use("/support-users", supportUserRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/modules", moduleRoutes);


app.get('*', (req, res) => {
  res.redirect("/content");
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