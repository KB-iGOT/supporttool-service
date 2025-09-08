import React, { Suspense, useEffect } from "react";
import "./App.css";
import { useLocation } from "react-router-dom";
import { Header } from "./Components/common-components/header";
// import { Sidebar } from "./Components/common-components/sidebar";
import { BreadcrumbNavigator } from "./Components/common-components/breadcrumbs";
import { AppContextProvider } from "./Context/AppContext";
import { Notification } from "./Components/common-components/notifications";
import JiraLinkPopup from "./Components/common-components/jira-popup";

const LazyApp = React.lazy(
  () => import("./Components/common-components/Lazy/index")
);

function App() {
  const location = useLocation();
  useEffect(() => {
    // Set background color based on environment
    const env = process.env.REACT_APP_ENV;
    const body = document.body;
    
    // Remove any existing environment classes
    body.classList.remove('env-production', 'env-development');
    
    if (env === 'production') {
      body.classList.add('env-production');
    } else {
      body.classList.add('env-development');
    }
  }, []);

  return (
      <AppContextProvider>
        <div className="App">
          <Header />
          <div className="flex-container">
            {/* <Sidebar /> */}
            <div className={location.pathname === '/login' ? 'login-container' : 'content-container'}>
              <BreadcrumbNavigator />
              <div>
                <Suspense fallback={<div>Loading...</div>}>
                  <LazyApp />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
        <Notification />
        <JiraLinkPopup />
      </AppContextProvider>
  );
}

export default App;
