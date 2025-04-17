import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./Components/home";
import { Login } from "./Components/authentication/login";
import { Header } from "./Components/common-components/header";
import { Sidebar } from "./Components/common-components/sidebar";
import { BreadcrumbNavigator } from "./Components/common-components/breadcrumbs";
import { SupportUsers } from "./Components/support-users";
import { Modules } from "./Components/modules";
import { AppContextProvider } from "./Context/AppContext";
import ProtectedRoute from "./Components/common-components/auth/ProtectedRoute";
import { Contents } from "./Components/contents";
import { Users } from "./Components/users";
import { Forms } from "./Components/forms";
import { ListSystemSettings } from "./Components/system-settings/list";
import { Editor } from "./Components/system-settings/editor";
import { SystemSettings } from "./Components/system-settings";

function App() {

  return (
    <BrowserRouter>
    <AppContextProvider>
      <div className="App">
        <Header />
        <div className="flex-container">
          <Sidebar />
          <div className="content-container">
            <BreadcrumbNavigator />
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/support-users" element={<ProtectedRoute><SupportUsers /></ProtectedRoute>} />
                <Route path="/modules" element={<ProtectedRoute><Modules /></ProtectedRoute>} />
                <Route path="/contents" element={<ProtectedRoute><Contents /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                <Route path="/forms" element={<ProtectedRoute><Forms /></ProtectedRoute>} />
                <Route path="/system-settings" element={<ProtectedRoute><SystemSettings /></ProtectedRoute>} >
                  <Route index element={<ListSystemSettings />} />
                  <Route path="edit/:id" element={<Editor />} />
                </Route>
              </Routes>
          </div>
        </div>
      </div>
      </AppContextProvider>
    </BrowserRouter>
  );
}

export default App;
