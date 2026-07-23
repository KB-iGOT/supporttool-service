# Windows Setup Guide - iGOT Support Tool

## Prerequisites

### 1. Install Node.js
- Download and install **Node.js 22.x** from https://nodejs.org/
- Verify: `node -v && npm -v`

### 2. Install PostgreSQL
- Download from https://www.postgresql.org/download/windows/
- Install (default port **5432**), set password for `postgres` user
- Verify: `psql -U postgres -c "SELECT version();"`
- Create database: `psql -U postgres -c "CREATE DATABASE \"support-tool-db\";"`

### 3. Install Cassandra (optional - only for audit logs)
- Download from https://cassandra.apache.org/download/
- Start the Cassandra service
- Default contact point: `localhost:9042`

### 4. (Optional) Install Git
- Download from https://git-scm.com/download/win

### 5. Install Pgadmin (Optional) to create/import the database

### 6. Import backed-up database to your created database
- backup-database\support-tool-db.sql
---

## Backend Setup (support-tool-server)

```powershell
# 1. Navigate to backend
cd support-tool-server

# 2. Install dependencies
npm install

# 3. Configure environment (edit .env as needed)
#    Defaults work for local PostgreSQL on port 5432
#    Key settings:
#      DB_USER=postgres
#      DB_HOST=localhost
#      DB_NAME=support-tool-db
#      DB_PASSWORD=root
#      DB_PORT=5432
#      PORT=5001

# 4. Start development server (auto-reloads on changes)
npm run dev
```

Server runs at **http://localhost:5001**

### What happens on startup
- Creates `users` table (if not exists)
- Creates `sessions` table (if not exists)
- Connects to Cassandra (audit logs)
- All API routes registered under `/api/*`

---

## Frontend Setup (support-tool-react-client)

```powershell
# 1. Navigate to frontend
cd support-tool-react-client

# 2. Install dependencies
npm install

# 3. Configure API URL (edit src/Config/env.ts if needed)
#    Default: http://localhost:5000/api
#    If running backend on a different port, update REACT_APP_API_BASE_URL

# 4. Start development server
npm start
```

Frontend runs at **http://localhost:3000**

---

## Database Details

### PostgreSQL tables (auto-created on first run)
| Table | Purpose |
|-------|---------|
| `users` | Support tool user accounts |
| `sessions` | User sessions (PostgreSQL-backed) |

### Cassandra keyspace
- Name: `sunbird` (or as set in `CASSANDRA_KEYSPACE`)
- Used for: Audit logs

---

## Environment Variables Reference

### Backend (.env)
| Variable | Default | Description |
|----------|---------|-------------|
| `DB_USER` | postgres | PostgreSQL user |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_NAME` | support-tool-db | PostgreSQL database name |
| `DB_PASSWORD` | root | PostgreSQL password |
| `DB_PORT` | 5432 | PostgreSQL port |
| `PORT` | 5001 | Backend server port |
| `FRONTEND_URL` | http://localhost:3000 | CORS allowed origin |
| `CASSANDRA_HOST` | 0.0.0.0 | Cassandra contact point |
| `CASSANDRA_KEYSPACE` | sunbird | Cassandra keyspace |
| `KONG_API_URL` | - | iGOT backend API base URL |
| `KEYCLOAK_CLIENT_ID` | support_igot | Keycloak client ID |

### Frontend (src/Config/env.ts)
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_BASE_URL` | http://localhost:5000/api | Backend API URL |

---

---

## Sample Configuration Files

### Backend `.env` (support-tool-server/.env)

```ini
DB_USER=postgres
DB_HOST=localhost
DB_NAME=support-tool-db
DB_PASSWORD=root
DB_PORT=5432

PORT=5001

#qa ENV sample
AUTHORIZATION="Bearer <your-jwt-token>"
KONG_API_URL="https://portal.<env>.karmayogibharat.net/"
KEYCLOAK_CLIENT_ID=support_igot
KEYCLOAK_CLIENT_SECRET=<your-client-secret>


HOST=http://localhost

FRONTEND_URL=http://localhost:3000
CASSANDRA_HOST=0.0.0.0
CASSANDRA_DATACENTER=datacenter1
CASSANDRA_KEYSPACE=sunbird

CASSANDRA_FORM_HOST=0.0.0.0
CASSANDRA_FORM_DATACENTER=datacenter1


POSTGRES_DB_USER=sunbird
POSTGRES_DB_HOST=0.0.0.0
POSTGRES_DB_NAME=sunbird
POSTGRES_DB_PASSWORD=sunbird
POSTGRES_DB_PORT=5433

LEARNING_SERVICE_URL=0.0.0.0:8081



PORTAL_CASSANDRA_CONSISTENCY_LEVEL=  'one',

CASSANDRA_IP= CASSANDRA_HOST || '10.177.157.30',

CASSANDRA_REPLICATION_FORM= 3,
CORS_ENVIRONMENT= 'prod',
TELEMETRY_SB_BASE= "http://IP-ADDR:9090",
SB_API_KEY=AUTHORIZATION


#QA ENV sample
ADMIN_USERNAME="<your-admin-username>"
ADMIN_PASSWORD="<your-admin-password>"
ADMIN_CLIENT_ID="igot-support-admin"
ADMIN_CLIENT_SECRET="<your-admin-client-secret>"
ADMIN_GRANT_TYPE="client_credentials"


```

### Frontend Runtime Config (support-tool-react-client/public/env.json)

```json
{
  "REACT_APP_API_BASE_URL": "http://localhost:5001/api",
  "REACT_APP_ENV": "production",
  "REACT_APP_UPLOAD_BASE_URL_NON_LOGGED_IN_PAGE": "https://uat.karmayogibharat.net/",
  "REACT_APP_UPLOAD_CONTENT_STORE_NON_LOGGED_IN_PAGE": "content-store",
  "REACT_APP_ROLES_LIST": [
    "DASHBOARD_ADMIN",
    "SPV_ADMIN",
    "SPV_PUBLISHER",
    "PUBLIC",
    "CBC_ADMIN",
    "CBC_MEMBER",
    "CBP_ADMIN",
    "CONTENT_CREATOR",
    "CONTENT_REVIEWER",
    "PROGRAM_COORDINATOR",
    "COMMUNITY_MODERATOR",
    "MDO_ADMIN",
    "MDO_LEADER",
    "WAT_MEMBER",
    "MDO_DASHBOARD_USER",
    "MDO_REPORT_ACCESSOR",
    "MENTOR",
    "STATE_ADMIN"
  ]
}
```

> **Note**: The `public/env.json` file is loaded at runtime and overrides compile-time defaults from `src/Config/env.ts`. This allows changing API URLs without rebuilding the frontend.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ECONNREFUSED` on startup | Ensure PostgreSQL is running |
| Port 5001 already in use | Change `PORT` in `.env` |
| CORS errors | Check `FRONTEND_URL` in backend `.env` matches frontend origin |
| Cassandra connection fails | Set `CASSANDRA_HOST` or skip if audit logs not needed |
