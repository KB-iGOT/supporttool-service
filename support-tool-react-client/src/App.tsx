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

function App() {
  const isLogin = window.location.pathname.includes('/login');

  return (
    <BrowserRouter>
      <div className="App">
        {!isLogin && <Header />}
        <div className="flex-container">
          {!isLogin && <Sidebar />}
          <div className="content-container">
            {!isLogin && <BreadcrumbNavigator />}
              <Routes>
                {/* <Route path="/" element={<Login />} /> */}
                {/* <Route index element={<Login />} /> */}
                <Route path="/login" element={<Login />} />
                <Route path="/home" element={<Home />} />
                <Route path="/support-users" element={<SupportUsers />} />
                <Route path="/modules" element={<Modules />} />
              </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
