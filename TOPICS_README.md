# Topics Feature - Quick Setup Guide

## ✅ What's Been Completed

The Topics feature has been fully implemented with the following components:

### Frontend ✅
- ✅ Topics list page with table, search, and pagination (`Topics.tsx`)
- ✅ Create Topic dialog (`CreateTopicDialog.tsx`)
- ✅ Edit Topic dialog (`EditTopicDialog.tsx`)
- ✅ Topics service with API integration (`topics.service.ts`)
- ✅ Route configuration added to React Router
- ✅ Sidebar icon mapping added (Topic icon)
- ✅ Reuses existing Material-UI components for consistency

### Backend ✅
- ✅ Topics controller with CRUD operations (`topics.controller.ts`)
- ✅ Topics routes with authentication middleware (`topics.routes.ts`)
- ✅ Route registered in main server file (`index.ts`)
- ✅ Audit logging integration for all operations
- ✅ JIRA link requirement for compliance

### Features ✅
- ✅ List all topics with pagination (configurable: 5, 10, 25, 50 per page)
- ✅ Search topics by name
- ✅ Filter by status (Active, Inactive, Draft)
- ✅ Create new topics with name and description
- ✅ Edit existing topics
- ✅ Delete topics (only if no communities associated)
- ✅ JIRA link popup for audit compliance
- ✅ Color-coded status chips
- ✅ Responsive Material-UI design
- ✅ Loading states and error handling
- ✅ Success/error notifications

## 🚀 Quick Start

### 1. Add Topics to Database
Run this SQL command in PostgreSQL to make Topics visible in the sidebar:

```sql
INSERT INTO modules ("name", "url", "isVisible", "isAdminModule", "isRootModule", "root")
VALUES ('Topics', '/topics', true, true, false, null)
ON CONFLICT ("url") DO NOTHING;
```

Or use the provided SQL file:
```bash
psql -U your_user -d your_database -f add-topics-module.sql
```

### 2. Configure Environment Variables
Ensure these are set in `support-tool-server/.env`:
```bash
KONG_API_URL=https://portal.uat.karmayogibharat.net
AUTHORIZATION=Bearer YOUR_TOKEN_HERE
```

### 3. Restart Application
```bash
# Backend
cd support-tool-server
npm run dev

# Frontend
cd support-tool-react-client
npm start
```

### 4. Access Topics
1. Login to the support tool
2. Look for "Topics" in the sidebar (Admin section if `isAdminModule=true`)
3. Click to access the Topics management page

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/topics/list` | Get topics with pagination/filters |
| POST | `/api/topics/create` | Create a new topic |
| PUT | `/api/topics/update` | Update an existing topic |
| DELETE | `/api/topics/delete` | Delete a topic |

## 📚 Documentation

- **Full Documentation**: See [TOPICS_FEATURE_DOCUMENTATION.md](./TOPICS_FEATURE_DOCUMENTATION.md)
- **General Patterns**: See [INSTRUCTIONS.md](./INSTRUCTIONS.md)

## 🎨 Design Patterns Used

- **Action Interceptor Pattern**: JIRA link requirement for audit compliance
- **Reusable Components**: Material-UI Table, Dialogs, and Forms
- **Service Layer**: Axios-based API calls through `apiClient`
- **Context API**: AppContext for global state and notifications
- **TypeScript**: Strongly typed interfaces for Topics
- **Responsive Grid**: Material-UI Grid system for mobile support

## 📁 Key Files

```
Frontend:
- src/Components/topics/Topics.tsx
- src/Components/topics/CreateTopicDialog.tsx
- src/Components/topics/EditTopicDialog.tsx
- src/services/topics.service.ts

Backend:
- src/controllers/topics.controller.ts
- src/routes/topics.routes.ts
```

## ✨ Features in Action

### Viewing Topics
Navigate to `/topics` to see the full list with:
- Pagination controls
- Search box for topic names
- Status filter dropdown
- Total count display

### Creating a Topic
1. Click "Create Topic" button
2. Fill in topic name (required) and description
3. Click "Create"
4. Enter JIRA link when prompted
5. Topic appears in the list

### Editing a Topic
1. Click three-dot menu in Actions column
2. Select "Edit"
3. Modify fields
4. Click "Update"
5. Enter JIRA link when prompted

### Deleting a Topic
1. Click three-dot menu in Actions column
2. Select "Delete" (only visible if no communities)
3. Confirm deletion
4. Enter JIRA link when prompted

## 🔍 Troubleshooting

### Topics not in sidebar?
→ Run the SQL script to add the module to the database

### 401 Unauthorized errors?
→ Check user session and authentication

### API errors?
→ Verify `KONG_API_URL` and `AUTHORIZATION` in backend `.env`

### No data loading?
→ Check network tab for API responses and verify external API is accessible

## 🎯 Next Steps

1. Run the SQL script to add Topics to modules table
2. Configure environment variables
3. Restart the application
4. Test the feature with different operations
5. Grant appropriate permissions to user roles

---

**Status**: ✅ Ready for Testing  
**Version**: 1.0.0  
**Date**: November 2025
