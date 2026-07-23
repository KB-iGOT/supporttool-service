# Ubuntu 20.04 Setup Guide - iGOT Support Tool

> This guide is tested for **Ubuntu 20.04 LTS (Focal Fossa)** with **PostgreSQL 12**.

---

# Prerequisites

## 1. Install Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt update
sudo apt install -y nodejs

node -v
npm -v
```

---

## 2. Install PostgreSQL 12

```bash
sudo apt update
sudo apt install -y postgresql postgresql-client
```

Enable PostgreSQL:

```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Verify installation:

```bash
sudo -u postgres psql -c "SELECT version();"
```

---

## 3. Configure PostgreSQL Authentication

Set a password for the postgres user:

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'root';"
```

Edit `pg_hba.conf`:

```bash
sudo nano /etc/postgresql/12/main/pg_hba.conf
```

Change

```
local   all             postgres                                peer
local   all             all                                     peer
```

to

```
local   all             postgres                                md5
local   all             all                                     md5
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

Verify:

```bash
psql -U postgres -h localhost -d postgres
```

Password:

```
root
```

---

## 4. Create Database

```bash
createdb -U postgres -h localhost support-tool-db
```

or

```bash
sudo -u postgres createdb support-tool-db
```

Verify:

```bash
psql -U postgres -h localhost -l
```

---

# Restore Database

## If backup is PostgreSQL 12

```bash
psql -U postgres -h localhost -d support-tool-db \
< backup-database/support-tool-db.sql
```

---

## If backup is PostgreSQL 18+

PostgreSQL 18 SQL dumps are **not fully compatible** with PostgreSQL 12.

You may need to remove the following lines from the SQL file before restoring:

```sql
\restrict
```

```sql
SET transaction_timeout = 0;
```

```sql
\unrestrict
```

If the dump references an owner that does not exist:

```
ERROR: role "stuser" does not exist
```

Create the role:

```bash
sudo -u postgres createuser stuser
```

Then restore:

```bash
psql -U postgres -h localhost -d support-tool-db \
< backup-database/support-tool-db.sql
```

---

# Install Cassandra (Optional)

Required only for Audit Logs.

```bash
curl -fsSL https://www.apache.org/dist/cassandra/KEYS \
| sudo gpg --dearmor \
-o /usr/share/keyrings/cassandra.gpg

echo "deb [signed-by=/usr/share/keyrings/cassandra.gpg] https://debian.cassandra.apache.org 41x main" \
| sudo tee /etc/apt/sources.list.d/cassandra.list

sudo apt update
sudo apt install -y cassandra

sudo systemctl enable cassandra
sudo systemctl start cassandra
```

Verify:

```bash
nodetool status
```

---

# Install Git

```bash
sudo apt install -y git

git --version
```

---

# Backend Setup

Navigate to backend:

```bash
cd support-tool-server
```

Install dependencies:

```bash
npm install
```

Create `.env`

Example:

```ini
DB_USER=postgres
DB_PASSWORD=root
DB_HOST=localhost
DB_NAME=support-tool-db
DB_PORT=5432

PORT=5001

FRONTEND_URL=http://localhost:3000

CASSANDRA_HOST=0.0.0.0
CASSANDRA_DATACENTER=datacenter1
CASSANDRA_KEYSPACE=sunbird
```

Start backend:

```bash
npm run dev
```

Backend URL:

```
http://localhost:5001
```

---

# Frontend Setup

Navigate:

```bash
cd support-tool-react-client
```

Install dependencies:

```bash
npm install
```

Update:

```
public/env.json
```

Example:

```json
{
  "REACT_APP_API_BASE_URL": "http://localhost:5001/api"
}
```

Run:

```bash
npm start
```

Frontend:

```
http://localhost:3000
```

---

# Verify Database

Connect:

```bash
psql -U postgres -h localhost -d support-tool-db
```

List tables:

```sql
\dt
```

Show databases:

```sql
\l
```

Show users:

```sql
SELECT * FROM users LIMIT 10;
```

Exit:

```sql
\q
```

---

# Useful PostgreSQL Commands

Create database

```bash
createdb -U postgres -h localhost support-tool-db
```

Drop database

```bash
dropdb -U postgres -h localhost support-tool-db
```

Connect

```bash
psql -U postgres -h localhost -d support-tool-db
```

Show databases

```sql
\l
```

Show tables

```sql
\dt
```

Describe table

```sql
\d users
```

View rows

```sql
SELECT * FROM users LIMIT 10;
```

Count rows

```sql
SELECT COUNT(*) FROM users;
```

---

# Troubleshooting

## Peer Authentication Failed

Change `peer` to `md5` in:

```
/etc/postgresql/12/main/pg_hba.conf
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

---

## Database Already Exists

```bash
dropdb -U postgres -h localhost support-tool-db

createdb -U postgres -h localhost support-tool-db
```

---

## Database Being Accessed

Terminate sessions:

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname='support-tool-db';
```

---

## Connection Refused

Ensure PostgreSQL is running:

```bash
sudo systemctl status postgresql
```

---

## Backend Cannot Connect

Verify `.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=support-tool-db
```

---

# Notes

- PostgreSQL **12** is recommended for Ubuntu 20.04.
- PostgreSQL 18 SQL dumps may require editing before restoring into PostgreSQL 12.
- pgAdmin is optional and is **not required** for development.
- Use `psql` for all database operations.

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
  "REACT_APP_UPLOAD_BASE_URL_NON_LOGGED_IN_PAGE": "https://<env>.karmayogibharat.net/",
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
| `ECONNREFUSED` on startup | Ensure PostgreSQL is running: `sudo systemctl start postgresql` |
| Port 5001 already in use | Change `PORT` in `.env` or kill process: `sudo kill $(sudo lsof -t -i:5001)` |
| CORS errors | Check `FRONTEND_URL` in backend `.env` matches frontend origin |
| Cassandra connection fails | Set `CASSANDRA_HOST` or skip if audit logs not needed |
| `role "postgres" does not exist` | Run: `sudo -u postgres psql -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'root';"` |
| Permission denied for socket | Check `pg_hba.conf`: ensure `local` line uses `md5` instead of `peer` |
