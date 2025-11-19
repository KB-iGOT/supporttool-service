# Topics Feature Documentation

## Overview
The Topics feature allows administrators to manage community topics (categories) within the iGOT platform. It provides a comprehensive interface for listing, creating, updating, and deleting topics with proper audit trail integration.

## Features Implemented

### Frontend (React Client)
- **Topics List Page**: Displays all topics with pagination, search, and filtering
- **Search & Filters**: Search by topic name and filter by status (Active/Inactive/Draft)
- **Table View**: Comprehensive table showing:
  - Category ID
  - Topic Name
  - Description
  - Department ID
  - Community Count
  - Status (with color-coded chips)
  - Created At
  - Last Updated At
  - Actions menu
- **Create Topic Dialog**: Modal for creating new topics
- **Edit Topic Dialog**: Modal for editing existing topics
- **Delete Confirmation**: Confirmation dialog for deleting topics (only available if no communities are associated)
- **JIRA Link Integration**: Uses action interceptor for audit compliance
- **Responsive Design**: Material-UI components with responsive grid layout

### Backend (Node.js Server)
- **GET /api/topics/list**: Fetch topics with pagination and filters
- **POST /api/topics/create**: Create a new topic
- **PUT /api/topics/update**: Update an existing topic
- **DELETE /api/topics/delete**: Delete a topic
- **Audit Logging**: All operations logged to Cassandra audit_logs
- **Authentication**: Protected routes with session validation

## Files Created/Modified

### Frontend Files
```
support-tool-react-client/src/
├── Components/topics/
│   ├── Topics.tsx                  ✅ Already existed
│   ├── CreateTopicDialog.tsx       ✅ Created
│   ├── EditTopicDialog.tsx         ✅ Created
│   └── index.ts                    ✅ Created
├── services/topics.service.ts      ✅ Already existed
└── Components/common-components/Lazy/index.tsx  ✅ Modified (added route)
```

### Backend Files
```
support-tool-server/src/
├── controllers/topics.controller.ts  ✅ Already existed
├── routes/topics.routes.ts           ✅ Already existed
└── index.ts                          ✅ Modified (registered route)
```

## Setup Instructions

### 1. Database Configuration
To make the Topics feature visible in the sidebar navigation, you need to add it to the `modules` table in PostgreSQL.

#### Option A: Using the Admin Interface
If you have access to the Modules management page (`/modules`):
1. Login to the support tool
2. Navigate to Modules section
3. Click "Create Module"
4. Fill in the following details:
   - **Name**: `Topics`
   - **URL**: `/topics`
   - **isVisible**: `true`
   - **isAdminModule**: `true` (if it should appear in Admin section)
   - **isRootModule**: `false`
   - **root**: (leave blank or set parent module ID)
5. Click "Save"

#### Option B: Direct Database Insert
If you prefer SQL, run this query directly in PostgreSQL:

```sql
INSERT INTO modules ("name", "url", "isVisible", "isAdminModule", "isRootModule", "root")
VALUES ('Topics', '/topics', true, true, false, null);
```

**Note**: Set `isAdminModule` to `true` if Topics should appear in the Admin section of the sidebar, or `false` for the regular modules section.

### 2. Permission Configuration
Ensure the appropriate roles have permissions to access the Topics module:

```sql
-- Example: Grant permissions to specific roles
-- (Adjust based on your permission system)
UPDATE role_permissions 
SET permissions = jsonb_set(
    permissions,
    '{/topics}',
    '{"canView": true, "canAdd": true, "canUpdate": true, "canDelete": true}'
)
WHERE role_name = 'ADMIN';
```

### 3. Environment Variables
Ensure the following environment variables are set in `.env`:

**Backend** (`support-tool-server/.env`):
```bash
# Kong API URL for community service
KONG_API_URL=https://portal.uat.karmayogibharat.net

# Authorization header (if required by the API)
AUTHORIZATION=Bearer YOUR_TOKEN_HERE
```

### 4. Restart Application
After database configuration:
```bash
# Backend
cd support-tool-server
npm run dev

# Frontend
cd support-tool-react-client
npm start
```

## API Integration

### External API Endpoint
The backend proxies requests to the iGOT Community API:

**Endpoint**: `https://portal.uat.karmayogibharat.net/api/community/v1/topic/search`

**Request Format**:
```json
{
  "filterCriteriaMap": {
    "status": "active"
  },
  "requestedFields": [],
  "pageNumber": 0,
  "pageSize": 10
}
```

**Response Format**:
```json
{
  "id": "api.community.search",
  "ver": "1.0",
  "ts": "2025-11-14T10:58:50.857Z",
  "params": {
    "resMsgId": null,
    "msgId": null,
    "err": null,
    "status": "success",
    "errMsg": null
  },
  "responseCode": "OK",
  "result": {
    "search_results": {
      "data": [
        {
          "categoryId": 19,
          "categoryName": "Employment and Labour",
          "description": "Description for Employment and Labour",
          "createdAt": "2025-05-27T11:39:27.479+00:00",
          "lastUpdatedAt": "2025-05-27T11:58:39.762+00:00",
          "departmentId": "0140908831042437120",
          "countOfCommunities": 1,
          "status": "active"
        }
      ],
      "facets": {},
      "totalCount": 16,
      "additionalInfo": []
    }
  }
}
```

## Usage Guide

### Viewing Topics
1. Navigate to `/topics` (or click "Topics" in the sidebar)
2. View the list of topics with pagination
3. Use search box to filter by topic name
4. Use status dropdown to filter by status (Active/Inactive/Draft)
5. Click "Search" to apply filters or "Clear" to reset

### Creating a Topic
1. Click the "Create Topic" button (top right)
2. Enter the following details:
   - **Topic Name** (required)
   - **Description** (optional)
3. Click "Create"
4. The JIRA link popup will appear (for audit compliance)
5. Enter a valid JIRA ticket link
6. Topic will be created and audit log will be recorded

### Editing a Topic
1. Click the three-dot menu icon in the Actions column
2. Select "Edit"
3. Modify the topic name or description
4. Click "Update"
5. Enter JIRA link when prompted
6. Changes will be saved and logged

### Deleting a Topic
1. Click the three-dot menu icon in the Actions column
2. Select "Delete" (only visible if the topic has no associated communities)
3. Confirm deletion in the popup
4. Enter JIRA link when prompted
5. Topic will be deleted and logged

**Note**: Topics with associated communities cannot be deleted to maintain data integrity.

## Key Features

### Audit Trail Integration
All critical operations (Create, Update, Delete) are logged to the audit trail with:
- User ID
- Module: `TOPICS`
- Sub-module: `CREATE_TOPIC`, `UPDATE_TOPIC`, or `DELETE_TOPIC`
- Action details
- JIRA link (required for compliance)
- Timestamp
- Request/Response payloads

### Search & Filtering
- **Search by Topic Name**: Real-time search with debouncing
- **Status Filter**: Active, Inactive, Draft, or All
- **Pagination**: Configurable page size (5, 10, 25, 50 rows per page)
- **Total Count**: Displays total number of matching topics

### Responsive Design
- Mobile-friendly layout using Material-UI Grid
- Sticky table headers for better scrolling experience
- Loading spinners for async operations
- Color-coded status chips (green for active, red for inactive, etc.)

### Error Handling
- User-friendly error messages
- API error details logged to console (development mode)
- Graceful fallbacks for missing data
- Network error handling

## Component Architecture

### Topics.tsx (Main Component)
- **State Management**: Local state with React hooks
- **Data Fetching**: useCallback with dependencies for automatic refetch
- **Pagination**: Material-UI TablePagination
- **Dialogs**: Create, Edit, and Delete modals
- **Action Menu**: Three-dot menu for row actions

### CreateTopicDialog.tsx
- **Props**: open, onClose, onSubmit, processing
- **Validation**: Required field checks
- **Form Reset**: Clears form after successful submission

### EditTopicDialog.tsx
- **Props**: open, onClose, onSubmit, topic, loading
- **Pre-fill**: Loads existing topic data
- **Validation**: Required field checks

## TypeScript Types

```typescript
interface Topic {
  categoryId: number;
  categoryName: string;
  description: string;
  parentId?: number;
  createdAt: string;
  lastUpdatedAt: string;
  departmentId: string;
  countOfCommunities: number;
  status: string;
}
```

## Testing Checklist

- [ ] Topics list loads with pagination
- [ ] Search by topic name works
- [ ] Status filter works correctly
- [ ] Create topic dialog opens and closes
- [ ] Create topic saves successfully with JIRA link
- [ ] Edit topic dialog pre-fills data
- [ ] Edit topic updates successfully with JIRA link
- [ ] Delete confirmation appears
- [ ] Delete button hidden for topics with communities
- [ ] Delete operation works with JIRA link
- [ ] Success notifications appear
- [ ] Error notifications appear on failure
- [ ] Loading states show during API calls
- [ ] Audit logs created for all operations
- [ ] Permissions checked before actions
- [ ] Responsive layout works on mobile

## Troubleshooting

### Topics not appearing in sidebar
**Solution**: Ensure the Topics module is added to the `modules` table in PostgreSQL with `isVisible=true`

### 401 Unauthorized errors
**Solution**: Check that the user is logged in and has a valid session. Verify the `userSession` middleware is working.

### 403 Forbidden errors
**Solution**: Verify the user's role has permissions to access the `/topics` route

### JIRA popup not appearing
**Solution**: Check that the `useActionIntercept` hook is properly configured in the AppContext

### Topics not loading from API
**Solution**: 
1. Check `KONG_API_URL` in backend `.env`
2. Verify the Authorization header is set correctly
3. Check network tab for API errors
4. Verify the external API endpoint is accessible

### Create/Update/Delete not working
**Solution**:
1. Check console for error messages
2. Verify audit logging is not failing
3. Check that JIRA link is being passed correctly
4. Verify the backend routes are registered

## Best Practices

1. **Always use JIRA links** for audit compliance
2. **Check permissions** before showing action buttons
3. **Validate inputs** on both frontend and backend
4. **Handle errors gracefully** with user-friendly messages
5. **Show loading states** during async operations
6. **Log to audit trail** for all critical operations
7. **Use TypeScript types** for type safety
8. **Keep components modular** and reusable

## Future Enhancements

Potential improvements for the Topics feature:
- [ ] Bulk topic operations (create, update, delete)
- [ ] Topic hierarchy (parent-child relationships)
- [ ] Import/Export topics via CSV
- [ ] Topic templates for common categories
- [ ] Advanced search with multiple filters
- [ ] Sort by columns
- [ ] Topic statistics (community count, engagement metrics)
- [ ] Merge duplicate topics functionality
- [ ] Topic approval workflow

## Support

For questions or issues with the Topics feature:
1. Check this documentation first
2. Review the INSTRUCTIONS.md for general patterns
3. Check audit logs for operation history
4. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Author**: iGOT Support Tool Development Team
