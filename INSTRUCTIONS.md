# iGOT Support Tool - Project Instructions

## 🎯 Project Overview

**iGOT Support Tool** is a comprehensive administrative platform for managing users, organizations, content, roles, and system configurations for the iGOT (Integrated Government Online Training) platform. It consists of a React TypeScript frontend and Node.js/Express TypeScript backend with PostgreSQL and Cassandra databases.

---

## 📁 Project Structure

```
supporttool/
├── support-tool-react-client/     # React TypeScript Frontend
├── support-tool-server/           # Node.js Express Backend
├── docker-compose.yaml            # Docker orchestration
└── Dockerfile                     # Container configuration
```

---

## 🎨 Frontend Architecture (support-tool-react-client)

### Technology Stack
- **Framework**: React 19.0.0 with TypeScript 4.9.5
- **UI Library**: Material-UI (MUI) v6.4.12
- **Routing**: React Router DOM v7.4.0
- **State Management**: Context API (AppContext, FormInterceptorContext)
- **HTTP Client**: Axios 1.8.4
- **Data Processing**: PapaParse 5.5.3 (CSV handling)
- **Code Editor**: Monaco Editor 4.7.0
- **Charts**: Chart.js 4.5.0 with react-chartjs-2
- **Date Handling**: date-fns 4.1.0

### Key Directory Structure

```
src/
├── Components/              # Feature modules
│   ├── analytics/          # Analytics & reporting
│   ├── audit-logs/         # Audit trail viewing
│   ├── authentication/     # Login/logout
│   ├── bulk-upload/        # Bulk operations
│   │   ├── deactivate-user/
│   │   ├── get-user-details/
│   │   ├── master-designation/
│   │   ├── migrate-users/        # V1: Small batches (≤50 users)
│   │   └── migrate-users-v2/     # V2: Large files (up to 50K users, chunked)
│   ├── common-components/  # Reusable UI components
│   ├── competency/         # Competency management
│   ├── content-hierarchy/  # Content organization
│   ├── contents/           # Content management
│   ├── domain/             # Domain management
│   ├── forms/              # Dynamic form builder
│   ├── modules/            # Module configuration
│   ├── organisation/       # Organization CRUD
│   ├── roles/              # Role management
│   ├── sessions/           # Session management
│   ├── system-settings/    # System configuration
│   ├── upload-contents/    # Content upload
│   ├── user-dashboard/     # User statistics
│   └── users/              # User management
├── Context/
│   ├── AppContext.tsx            # Global app state
│   └── FormInterceptorContext.tsx # Form interceptor
├── hooks/
│   ├── useActionInterceptor.tsx  # JIRA link requirement
│   ├── useDebounce.ts
│   └── useFormsInterceptor.tsx
├── services/                # API service layer
├── types/                   # TypeScript definitions
├── utils/                   # Helper functions
└── Config/                  # Environment config
```

### Critical Patterns & Concepts

#### 1. **Action Interceptor Pattern** (JIRA Link Requirement)
**Purpose**: Enforce JIRA ticket linking for critical operations (audit trail compliance)

**Files**:
- `hooks/useActionInterceptor.tsx`
- `Context/AppContext.tsx`
- `Components/common-components/jira-popup`

**Usage**:
```typescript
const { handleAction: handleMigrate } = useActionInterceptor({
  actionType: 'MIGRATE_USERS_BULK',
  onComplete: async (interceptPayload) => {
    // interceptPayload.jiraLink contains the JIRA link
    const payload = {
      ...data,
      jiraLink: interceptPayload.jiraLink
    };
    await api.call(payload);
  },
  getPayload: () => ({ count: usersToMigrate.length })
});

// Trigger the action
handleMigrate();
```

**Key Components**:
- `interceptAction()`: Captures action and shows popup
- `completeAction(jiraLink)`: Executes with JIRA link
- `cancelAction()`: Aborts operation

**When to Use**:
- User migrations
- Bulk operations
- Status updates
- Role changes
- Critical data modifications

#### 2. **Module Permission System**
**Files**:
- `Context/AppContext.tsx`
- `utils/permissionUtils.ts`

**Permissions Object Structure**:
```typescript
{
  module_url: {
    canView: boolean,
    canAdd: boolean,
    canUpdate: boolean,
    canDelete: boolean
  }
}
```

**Usage**:
```typescript
const { checkPermissions } = useContext(AppContext);
const permissions = checkPermissions('/users');
if (permissions.canUpdate) {
  // Show edit button
}
```

#### 3. **CSV Processing Pattern** (Bulk Operations)

**Common Flow**:
1. **Upload**: Drag-and-drop or file picker
2. **Parse**: PapaParse with header transformation
3. **Validate**: Check required fields
4. **Chunk**: Split large datasets (V2 only)
5. **Process**: API calls with progress tracking
6. **Results**: Success/failure tables with download

**Example** (from migrate-users-v2):
```typescript
Papa.parse<CsvData>(file, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (header: string): string => {
    const normalized = header.toLowerCase().replace(/ /g, '');
    if (normalized === 'emailid' || normalized === 'email') return 'email';
    if (normalized === 'userid' || normalized === 'identifier') return 'userId';
    return header;
  },
  complete: (results) => {
    const data = results.data.filter(row => 
      (row.email || row.phone || row.userId) && row.channel
    );
    setCsvData(data);
  }
});
```

**Chunking Strategy** (V2):
- Chunk size: 500 users per chunk
- User fetch batch size: 100 per API call
- Delay between chunks: 2 seconds
- Maximum users: 50,000

#### 4. **User Migration Priority Logic**

**Priority Order**: `userId/identifier > email+phone > email > phone`

**Implementation**:
```typescript
if (userId) {
  const user = userMapByUserId.get(userId);
  // Process by userId
} else if (email && phone) {
  // Validate both match same user
} else if (email) {
  // Process by email only
} else if (phone) {
  // Process by phone only
}
```

#### 5. **JSON Editor Pattern** (Forms/Config)

**Technology**: Monaco Editor (@monaco-editor/react)

**Key Pattern**: Uncontrolled component to prevent flickering
```typescript
<Editor
  height="400px"
  defaultLanguage="json"
  defaultValue={formattedInput}  // NOT value={...}
  onMount={handleEditorDidMount}
  options={{
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false
  }}
/>
```

**Validation**:
- Manual validation via button (not automatic)
- Uses `editor.getValue()` to retrieve current content
- Validates JSON.parse()

---

## 🔧 Backend Architecture (support-tool-server)

### Technology Stack
- **Runtime**: Node.js with TypeScript 5.8.2
- **Framework**: Express 4.21.2
- **Databases**: 
  - PostgreSQL (pg 8.14.1) - Primary data
  - Cassandra (cassandra-driver 4.8.0) - Audit logs
- **Authentication**: Keycloak Connect 26.1.1
- **Session**: express-session with connect-pg-simple
- **Logging**: Winston 3.17.0
- **CSV Processing**: json2csv 6.0.0

### Key Directory Structure

```
src/
├── index.ts                    # Server entry point
├── config/
│   ├── database.ts            # PostgreSQL connection
│   └── winston.js             # Logger configuration
├── controllers/               # Business logic
│   ├── users.controller.ts
│   ├── organisations.controller.ts
│   ├── forms.controller.ts
│   └── ...
├── routes/                    # API endpoints
│   ├── users.routes.ts
│   ├── organisations.routes.ts
│   └── ...
├── helpers/
│   ├── auditLogger.ts         # Audit trail helper
│   ├── authHelper.ts          # Auth utilities
│   ├── sessionValidator.ts    # Session middleware
│   └── clientRoutes.ts        # SPA routing
└── utils/
    ├── logger.ts              # Winston logger
    └── cassandra.ts           # Cassandra connection
```

### Critical Patterns & Concepts

#### 1. **Session Management**

**Custom Session Store**: PostgreSQL-backed with token/userId sync
```typescript
const store = new PgSession({ 
  pool: pgPool, 
  tableName: 'sessions' 
});

// Monkey-patched to sync token/userId
store.set = (sid, sess, callback) => {
  originalSet(sid, sess, async (err) => {
    await pgPool.query(
      'UPDATE sessions SET token = $1, user_id = $2 WHERE sid = $3',
      [sess.user.token, sess.user.id, sid]
    );
  });
};
```

**Sessions Table Schema**:
```sql
CREATE TABLE sessions (
  sid varchar PRIMARY KEY,
  expire timestamp(6) NOT NULL,
  sess JSON NOT NULL,
  token varchar,
  user_id varchar
);
```

#### 2. **Audit Logging Pattern**

**File**: `helpers/auditLogger.ts`

**Every critical operation must log**:
```typescript
await logAuditEntry({
  userId: req.session.user.id,
  module: 'Users',
  action: 'UPDATE_ROLE',
  changes: {
    userId: targetUserId,
    oldRoles: ['USER'],
    newRoles: ['USER', 'ADMIN']
  },
  jiraLink: req.body.jiraLink,
  ipAddress: req.ip
});
```

**Stored in**: Cassandra database (distributed audit trail)

#### 3. **Middleware Pattern**

**Session Validation** (`helpers/sessionValidator.ts`):
```typescript
export const userSession = async (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
```

**Usage**:
```typescript
router.post('/migrate', userSession, migrateUser);
```

#### 4. **Proxy Pattern** (External API Calls)

**Purpose**: Route requests to iGOT backend APIs
**File**: `routes/proxy.routes.ts`

```typescript
router.post('/user/v1/read', userSession, async (req, res) => {
  const response = await axios.post(
    `${SUNBIRD_API}/user/v1/read`,
    req.body,
    { headers: { 'x-authenticated-user-token': token } }
  );
  res.json(response.data);
});
```

#### 5. **CORS Configuration**

**Dynamic Origin Handling**:
```typescript
app.use((req, res, next) => {
  const origin = req.headers.referer || req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin.replace(/\/$/, ''));
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});
```

---

## 🗄️ Database Schema

### PostgreSQL Tables

#### 1. **users** (Support tool users)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  "userId" VARCHAR(50) UNIQUE NOT NULL,
  "userName" VARCHAR(100) UNIQUE NOT NULL,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  roles TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 2. **sessions** (User sessions)
```sql
CREATE TABLE sessions (
  sid varchar PRIMARY KEY,
  expire timestamp(6) NOT NULL,
  sess JSON NOT NULL,
  token varchar,
  user_id varchar
);
```

#### 3. **org_hierarchy_v4** (Organization structure)
- Complex hierarchical organization data
- Used for organization management

### Cassandra Tables

#### **audit_logs** (Audit trail)
- Distributed storage for compliance
- Stores all critical operations
- Queryable by userId, module, dateRange

---

## 🔐 Authentication & Authorization

### Flow
1. **Login**: POST `/api/auth/login` → Keycloak authentication
2. **Session**: Created in PostgreSQL sessions table
3. **Token**: Stored in session, used for external API calls
4. **Permissions**: Role-based, checked via `modulePermissions`
5. **Logout**: POST `/api/auth/logout` → Session destroyed

### Role Types
- **USER**: Basic access
- **ADMIN**: Administrative operations
- **Module-specific**: Defined in role permissions

---

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Current user session

### Users
- `GET /api/users` - List users (paginated, filtered)
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `POST /api/users/migrate` - Migrate user to new org
- `POST /api/users/bulk/migrate` - Bulk user migration
- `POST /api/users/reset-password` - Reset password
- `POST /api/users/block` - Block/unblock user

### Organizations
- `GET /api/org` - List organizations
- `POST /api/org` - Create organization
- `PATCH /api/org/:id` - Update organization
- `DELETE /api/org/:id` - Delete organization
- `PATCH /api/org/status/update` - Update org status (with audit)

### Forms
- `GET /api/forms` - List forms
- `POST /api/forms` - Create form
- `PATCH /api/forms/:id` - Update form
- `POST /api/forms/validate` - Validate form JSON

### Modules
- `GET /api/modules` - List modules
- `POST /api/modules` - Create module
- `PATCH /api/modules/:id` - Update module

### Audit Logs
- `GET /api/audit-logs` - Query audit logs
- `POST /api/audit-logs/export` - Export audit logs

### Bulk Operations
- `POST /api/users/bulk/deactivate` - Bulk deactivate
- `POST /api/users/bulk/details` - Bulk get user details
- `POST /api/users/bulk/migrate` - Bulk migrate (V1/V2)

---

## 📊 Key Features by Module

### 1. **Bulk Upload Operations**
- **Migrate Users V1**: Small batches (≤50 users), simple processing
- **Migrate Users V2**: Large files (up to 50K), chunked with progress
- **Get User Details**: Fetch detailed user info via email/phone/userId
- **Deactivate Users**: Bulk user deactivation
- **Master Designation**: Upload designation data

**Common CSV Headers**:
- Email, Phone, userId/identifier (flexible naming)
- Channel/Organization (target org)

### 2. **User Management**
- Search: email, phone, userId, name
- Filters: status, organization, role
- Actions: edit, migrate, reset password, block/unblock, change roles
- Bulk operations support
- Certificate re-issue

### 3. **Organization Management**
- Hierarchical structure (org_hierarchy_v4)
- Status management (Active/Inactive)
- Soft delete support
- Audit trail for all changes

### 4. **Form Builder**
- JSON-based form definitions
- Monaco editor with validation
- Dynamic field types
- Preview functionality

### 5. **Content Management**
- Content hierarchy organization
- Content upload (bulk/single)
- Metadata management
- Content deletion with soft delete

### 6. **Analytics & Dashboard**
- User statistics
- Module usage tracking
- Chart.js visualizations
- Export capabilities

### 7. **Audit Logs**
- All critical operations logged
- JIRA link requirement
- Cassandra storage for scalability
- Export to CSV

---

## 🎨 UI/UX Patterns

### Common Components

#### 1. **Upload UI Pattern**
```tsx
<Grid container spacing={3}>
  <Grid item xs={12} md={6}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Download Sample</Typography>
      <Button startIcon={<DownloadIcon />} href={sampleCsv}>
        Download
      </Button>
    </Paper>
  </Grid>
  <Grid item xs={12} md={6}>
    <Paper sx={{ p: 3 }}>
      <Box component="label" onDrop={handleDrop} /* drag-drop box */>
        <input type="file" accept=".csv" hidden />
        <UploadIcon />
        <Typography>Drag & Drop or Browse</Typography>
      </Box>
    </Paper>
  </Grid>
</Grid>
```

#### 2. **Data Table Pattern**
```tsx
<TableContainer component={Paper} sx={{ maxHeight: 400 }}>
  <Table stickyHeader size="small">
    <TableHead>
      <TableRow>
        <TableCell>Header 1</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map(row => (
        <TableRow key={row.id}>
          <TableCell>{row.value}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

#### 3. **Progress Tracking**
```tsx
<LinearProgress variant="determinate" value={progress} />
<Typography>{`${progress}%`}</Typography>
```

#### 4. **Notification Pattern**
```tsx
const { setNotification } = useContext(AppContext);

setNotification({
  open: true,
  message: 'Operation successful!',
  severity: 'success' // 'error', 'info', 'warning'
});
```

---

## 🔄 Data Flow Examples

### User Migration Flow (V2)
```
1. Upload CSV → Parse with PapaParse
2. Transform headers → email, phone, userId, channel
3. Split into chunks (500 users each)
4. For each chunk:
   a. Fetch users in batches (100 per API call)
      - By email (if provided)
      - By phone (if provided)
      - By userId (if provided)
   b. Validate matches (priority: userId > email+phone > email > phone)
   c. Check if already in target org
   d. Build migration payload
5. Execute JIRA interceptor
6. Bulk migrate API call
7. Display results (success/failure tables)
8. Download reports
```

### Form Validation Flow
```
1. User types JSON in Monaco Editor
2. Click "Validate JSON" button
3. editor.getValue() → get current content
4. Try JSON.parse()
5. If valid: setIsValid(true), show success
6. If invalid: setIsValid(false), show error message
7. "Save" button enabled only if valid
```

### Audit Log Flow
```
1. User performs critical action
2. JIRA popup appears
3. User enters JIRA link
4. Action proceeds with JIRA link in payload
5. Backend logs to Cassandra:
   - userId, module, action, changes, jiraLink, timestamp, IP
6. Audit log viewable in Audit Logs module
```

---

## 🛠️ Development Guidelines

### When Adding New Features

#### 1. **Bulk Operation**
- Create in `Components/bulk-upload/`
- Use PapaParse for CSV
- Implement progress tracking
- Add success/failure tables
- Provide sample CSV
- Add JIRA interceptor if critical

#### 2. **User Action**
- Check if critical (requires audit)
- If yes: Add `useActionInterceptor`
- Update backend to accept `jiraLink`
- Log to Cassandra audit_logs
- Check permissions via `checkPermissions()`

#### 3. **New API Endpoint**
- Create route in `routes/`
- Create controller in `controllers/`
- Add `userSession` middleware if protected
- Add audit logging if critical
- Create service in `services/` (frontend)
- Update TypeScript types

#### 4. **Form/Config Editor**
- Use Monaco Editor (JSON)
- Uncontrolled component pattern
- Manual validation button
- Preview functionality
- Save/Cancel actions with confirmation

### Code Standards

#### TypeScript
- Strict mode enabled
- Define interfaces for all data structures
- Use `unknown` over `any`
- Proper error typing

#### React
- Functional components with hooks
- Context for global state
- Custom hooks for reusable logic
- Proper cleanup in useEffect

#### Material-UI
- Use `sx` prop for styling
- Consistent spacing (theme units)
- Responsive Grid layout
- Accessible components

#### CSV Processing
```typescript
// Always transform headers for flexibility
transformHeader: (header: string): string => {
  const normalized = header.toLowerCase().replace(/ /g, '');
  // Map variations to standard field name
  if (normalized === 'emailid' || normalized === 'email') return 'email';
  return header;
}
```

---

## 🐛 Common Issues & Solutions

### 1. **JSON Editor Flickering**
**Problem**: Editor re-renders on every keystroke
**Solution**: Use `defaultValue` instead of `value`, uncontrolled component

### 2. **Fullscreen Width Accumulation**
**Problem**: Width increases on each fullscreen toggle
**Solution**: Add `overflow: 'hidden'` to container

### 3. **CSV Validation Blocking**
**Problem**: Automatic validation runs too frequently
**Solution**: Manual validation via button only

### 4. **User Migration: userId vs identifier**
**Problem**: Some users have different userId and identifier
**Solution**: Map both in userMapByUserId
```typescript
userMapByUserId.set(user.userId, user);
if (user.identifier !== user.userId) {
  userMapByUserId.set(user.identifier, user);
}
```

### 5. **Session Expiry**
**Problem**: Token expires, API calls fail
**Solution**: Check session before critical operations, redirect to login

### 6. **Large CSV Upload**
**Problem**: 413 Payload Too Large
**Solution**: Use V2 chunked processing (500 users per chunk)

---

## 📝 Environment Variables

### Frontend (.env)
```bash
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_ENV=development  # or 'production'
REACT_APP_UPLOAD_BASE_URL_NON_LOGGED_IN_PAGE=https://uat.karmayogibharat.net/
REACT_APP_UPLOAD_CONTENT_STORE_NON_LOGGED_IN_PAGE=content-store
```

### Backend (.env)
```bash
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/supporttool
CASSANDRA_CONTACT_POINTS=localhost
CASSANDRA_KEYSPACE=audit_logs
SUNBIRD_API_BASE_URL=https://api.sunbird.org
SESSION_SECRET=f4be817d-845f-4057-b72c-96f48896502f
```

---

## 🚀 Running the Application

### Development

**Frontend**:
```bash
cd support-tool-react-client
npm install
npm start  # Runs on http://localhost:3000
```

**Backend**:
```bash
cd support-tool-server
npm install
npm run dev  # Runs on http://localhost:5000
```

### Production Build

**Frontend**:
```bash
npm run build  # Creates optimized build/ directory
```

**Backend**:
```bash
npm run build  # Compiles TypeScript to dist/
npm start      # Runs from dist/index.js
```

---

## 📚 Key Dependencies Explained

### Frontend
- **@mui/material**: Component library for consistent UI
- **@monaco-editor/react**: Code editor (JSON editing)
- **papaparse**: CSV parsing with header transformation
- **react-router-dom**: SPA routing
- **axios**: HTTP client with interceptors
- **chart.js**: Data visualization
- **date-fns**: Date formatting/manipulation

### Backend
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store
- **keycloak-connect**: SSO authentication
- **cassandra-driver**: Distributed audit logs
- **json2csv**: CSV export functionality
- **winston**: Structured logging
- **express-validator**: Input validation

---

## 🎯 Prompting Guidelines

When working with this codebase, provide:

1. **Context**: Which module/feature you're working on
2. **Operation Type**: CRUD, bulk operation, audit-required action
3. **Data Flow**: Frontend ↔ Backend ↔ Database
4. **Patterns**: Mention if using interceptor, CSV processing, etc.

**Example Prompts**:

✅ **Good**:
> "I need to add a bulk user role update feature in the bulk-upload module. It should:
> 1. Accept CSV with userId and new role
> 2. Use V2 chunking for large files
> 3. Require JIRA link (useActionInterceptor)
> 4. Log to audit_logs
> 5. Show success/failure tables with download"

✅ **Good**:
> "Fix the JSON editor in forms module - it's flickering when typing. Need uncontrolled component pattern."

✅ **Good**:
> "Add userId/identifier support to the get-user-details bulk operation, with priority: userId > email > phone"

❌ **Avoid**:
> "Add user feature"
> "Fix bug"
> "Update table"

---

## 📖 Additional Resources

- **Material-UI Docs**: https://mui.com/
- **Monaco Editor**: https://microsoft.github.io/monaco-editor/
- **PapaParse**: https://www.papaparse.com/
- **React Router**: https://reactrouter.com/
- **Express**: https://expressjs.com/

---

## 🔍 Quick Reference

### File Locations for Common Tasks

| Task | Frontend File | Backend File |
|------|---------------|--------------|
| Add bulk operation | `Components/bulk-upload/*/index.tsx` | `routes/*.routes.ts` + `controllers/*.controller.ts` |
| Add JIRA interceptor | Use `hooks/useActionInterceptor.tsx` | Accept `jiraLink` in payload |
| Audit logging | N/A | `helpers/auditLogger.ts` |
| Permission check | `utils/permissionUtils.ts` | `helpers/sessionValidator.ts` |
| CSV parsing | PapaParse in component | N/A |
| JSON editing | Monaco Editor component | N/A |
| Session management | `Context/AppContext.tsx` | `index.ts` (session setup) |

---

## ✅ Checklist for New Features

- [ ] TypeScript interfaces defined
- [ ] Permission checks implemented
- [ ] JIRA interceptor added (if critical)
- [ ] Audit logging added (if critical)
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Success/error notifications
- [ ] Responsive UI (Grid layout)
- [ ] Sample CSV provided (if bulk op)
- [ ] Download results functionality
- [ ] Progress tracking (if long operation)
- [ ] Backend validation
- [ ] Database transactions (if multi-step)

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Maintained By**: iGOT Support Team
