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
              </Routes>
          </div>
        </div>
      </div>
      </AppContextProvider>
    </BrowserRouter>
  );
}

export default App;
