// Simple test script for audit logs API
const express = require('express');
const bodyParser = require('body-parser');

// Import our controller
const auditLogsController = require('./dist/controllers/audit-logs.controller');

const app = express();
app.use(bodyParser.json());

// Add CORS for testing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// Test routes
app.get('/api/audit-logs', auditLogsController.getAuditLogs);
app.get('/api/audit-logs/:id', auditLogsController.getAuditLogById);

const port = 3001;
app.listen(port, () => {
  console.log(`🚀 Test server running on http://localhost:${port}`);
  console.log('Test the API with:');
  console.log(`  GET http://localhost:${port}/api/audit-logs`);
  console.log(`  GET http://localhost:${port}/api/audit-logs?module=users`);
  console.log(`  GET http://localhost:${port}/api/audit-logs?status=FAILURE`);
});
