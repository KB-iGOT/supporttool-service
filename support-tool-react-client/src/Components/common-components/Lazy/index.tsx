import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import ProtectedRoute from "../auth/ProtectedRoute";
import { Organisations } from "../../organisation";
import { OrganisationList } from "../../organisation/list";
import { BulkUpload } from "../../bulk-upload";

const DesignationView = lazy(() =>
  import("../../organisation/DesignationView").then((module) => ({
    default: module.DesignationView,
  }))
);

const ImportDesignationsPage = lazy(() =>
  import("../../organisation/ImportDesignationsPage").then((module) => ({
    default: module.ImportDesignationsPage,
  }))
);

const ModuleDashboard = lazy(() =>
  import("../../home/index").then((module) => ({
    default: module.Home,
  }))
);

const Login = lazy(() =>
  import("../../authentication/login/index").then((module) => ({
    default: module.Login,
  }))
);
const SupportUsers = lazy(() =>
  import("../../support-users/index").then((module) => ({
    default: module.SupportUsers,
  }))
);
const Modules = lazy(() =>
  import("../../modules/index").then((module) => ({
    default: module.Modules,
  }))
);
const Contents = lazy(() =>
  import("../../contents/index").then((module) => ({
    default: module.Contents,
  }))
);
const ContentHierarchy = lazy(() =>
  import("../../content-hierarchy/index").then((module) => ({
    default: module.ContentHierarchy,
  }))
);

const Users = lazy(() =>
  import("../../users/index").then((module) => ({
    default: module.Users,
  }))
);
const UsersList = lazy(() =>
  import("../../users/list-user/index").then((module) => ({
    default: module.UsersList,
  }))
);
const ReissueCertificate = lazy(() =>
  import("../../users/re-issue-certificate").then((module) => ({
    default: module.ReissueCertificate,
  }))
);
const Sessions = lazy(() =>
  import("../../sessions/index").then((module) => ({
    default: module.Sessions,
  }))
);
const Forms = lazy(() =>
  import("../../forms/index").then((module) => ({
    default: module.Forms,
  }))
);
const SystemSettings = lazy(() =>
  import("../../system-settings/index").then((module) => ({
    default: module.SystemSettings,
  }))
);
const ListSystemSettings = lazy(() =>
  import("../../system-settings/list").then((module) => ({
    default: module.ListSystemSettings,
  }))
);
const Edit = lazy(() =>
  import("../../system-settings/edit").then((module) => ({
    default: module.Edit,
  }))
);

const CadreEdit = lazy(() =>
  import("../../system-settings/cadre-edit").then((module) => ({
    default: module.CadreEdit,
  }))
);

const Create = lazy(() =>
  import("../../system-settings/create").then((module) => ({
    default: module.Create,
  }))
);

const DeleteOrg = lazy(() =>
  import("../../delete-org-hierarchy").then((module) => ({
    default: module.DeleteOrg,
  }))
);

const Domains = lazy(() =>
  import("../../domain").then((module) => ({
    default: module.Domain,
  }))
);
const Roles = lazy(() =>
  import("../../roles").then((module) => ({
    default: module.Roles,
  }))
);

const UploadContents = lazy(() =>
  import("../../non-logged-in-page/upload-contents").then((module) => ({
    default: module.UploadContents,
  }))
);
const NonLoggedInPage = lazy(() =>
  import("../../non-logged-in-page").then((module) => ({
    default: module.NonLoggedInPage,
  }))
);
const AnnouncementSection = lazy(() =>
  import("../../non-logged-in-page/announcement-section").then((module) => ({
    default: module.AnnouncementSection,
  }))
);
const ModuleCards = lazy(() =>
  import("../../non-logged-in-page/module-cards").then((module) => ({
    default: module.ModuleCards,
  }))
);

const ApiCalls = lazy(() =>
  import("../../api-call").then((module) => ({
    default: module.ApiCalls,
  }))
);

const AuditLogs = lazy(() =>
  import("../../audit-logs").then((module) => ({
    default: module.AuditLogs,
  }))
);

const Analytics = lazy(() =>
  import("../../analytics").then((module) => ({
    default: module.Analytics,
  }))
);

const UserDashboard = lazy(() =>
  import("../../user-dashboard").then((module) => ({
    default: module.UserDashboard,
  }))
);

const Competency = lazy(() =>
  import("../../competency").then((module) => ({
    default: module.Competency,
  }))
);

const BulkFeaturesList = lazy(() =>
  import("../../bulk-upload/bulk-features-list").then(module => ({ default: module.BulkFeaturesList }))
);

const DeactivateUser = lazy(() =>
  import("../../bulk-upload/deactivate-user").then(module => ({ default: module.DeactivateUser }))
);
const MigrateUsers = lazy(() =>
  import("../../bulk-upload/migrate-users").then(module => ({ default: module.MigrateUsers }))
);
const MigrateUsersV2 = lazy(() =>
  import("../../bulk-upload/migrate-users-v2").then(module => ({ default: module.MigrateUsersV2 }))
);

const MasterDesignations = lazy(() =>
  import("../../bulk-upload/master-designation").then((module) => ({
    default: module.MasterDesignations,
  }))
);

const GetUserDetails = lazy(() =>
  import("../../bulk-upload/get-user-details").then((module) => ({
    default: module.GetUserDetails,
  }))
);




const LazyApp = () => {
  return (
      <Suspense fallback={<div>Loading route...</div>}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/support-users"
            element={
              <ProtectedRoute>
                <SupportUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/modules"
            element={
              <ProtectedRoute>
                <Modules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contents"
            element={
              <ProtectedRoute>
                <Contents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/content-hierarchy"
            element={
              <ProtectedRoute>
                <ContentHierarchy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          >
            <Route index element={<UsersList />} />
            <Route path="certificates" element={<ReissueCertificate />} />
          </Route>
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forms"
            element={
              <ProtectedRoute>
                <Forms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/system-settings"
            element={
              <ProtectedRoute>
                <SystemSettings />
              </ProtectedRoute>
            }
          >
            <Route index element={<ListSystemSettings />} />
            <Route path="edit/:id" element={<Edit />} />
            <Route path="create" element={<Create />} />
            <Route path="cadre-edit/:id" element={<CadreEdit />} />
          </Route>
          <Route
            path="/organisations"
            element={
              <ProtectedRoute>
                <Organisations />
              </ProtectedRoute>
            }
          >
            
            <Route index element={<OrganisationList />} />
            <Route path="designations/:orgId/:frameworkId" element={<DesignationView />} />
            <Route path="designations/import/:orgId/:frameworkId" element={<ImportDesignationsPage />} />
          </Route>
          <Route
            path="/org-delete"
            element={
              <ProtectedRoute>
                <DeleteOrg />
              </ProtectedRoute>
            }
          />
          <Route
            path="/domain"
            element={
              <ProtectedRoute>
                <Domains />
              </ProtectedRoute>
            }
          /> 
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <Roles />
              </ProtectedRoute>
            }
          /> 
          {/* <Route
          path="/upload-contents"
          element={
            <ProtectedRoute>
              <UploadContents />
            </ProtectedRoute>
          }
        /> */}

        <Route path="/api-cals" element={<ApiCalls />} />
        <Route
            path="/audit-logs"
            element={
              <ProtectedRoute>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
           <Route
            path="/module-dashboard"
            element={
              <ProtectedRoute>
                <ModuleDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/competency"
            element={
              <ProtectedRoute>
                <Competency />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bulk-upload"
            element={
              <ProtectedRoute>
                <BulkUpload />
              </ProtectedRoute>
            }
          >
            <Route index element={<BulkFeaturesList />} />
            <Route path="migrate-users" element={<MigrateUsers />} />
            <Route path="migrate-users-v2" element={<MigrateUsersV2 />} />
            <Route path="deactivate-user" element={<DeactivateUser />} />
            <Route path="get-user-details" element={<GetUserDetails />} />

          <Route
            path="master-designation"
            element={
              <ProtectedRoute>
                <MasterDesignations />
              </ProtectedRoute>
            }
          />
          </Route>
        <Route
            path="/non-logged-in-page"
            element={
              <ProtectedRoute>
                <NonLoggedInPage />
              </ProtectedRoute>
            }
          >
            <Route index element={<ModuleCards />} />
            <Route path="/non-logged-in-page/:id" element={<AnnouncementSection />} />
            
            <Route path="/non-logged-in-page/:id/upload-contents" element={<UploadContents />} />
            <Route path="/non-logged-in-page/:id/edit/:doId" element={<UploadContents />} />
          </Route>
        </Routes>
      </Suspense>
  );
};

export default LazyApp;
