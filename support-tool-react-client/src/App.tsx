import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./Components/home";
import { Login } from "./Components/authentication/login";
import { Header } from "./Components/common-components/header";
import { Sidebar } from "./Components/common-components/sidebar";
import { BreadcrumbNavigator } from "./Components/common-components/breadcrumbs";
import { SupportUsers } from "./Components/support-users";

function App() {
  return (
    <div className="App">
      <Header />
      <div className="flex-container">
        <Sidebar />
        <div className="content-container">
          <BreadcrumbNavigator />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route index element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/support-users" element={<SupportUsers />} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </div>
  );
}

export default App;
