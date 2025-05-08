import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import ProtectedRoute from "../auth/ProtectedRoute";
import { Organisations } from "../../organisation";
import { OrganisationList } from "../../organisation/list";

const Home = lazy(() =>
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
const Users = lazy(() =>
  import("../../users/index").then((module) => ({
    default: module.Users,
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

const LazyApp = () => {
  return (
      <Suspense fallback={<div>Loading route...</div>}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
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
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
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
          </Route>
        </Routes>
      </Suspense>
  );
};

export default LazyApp;
