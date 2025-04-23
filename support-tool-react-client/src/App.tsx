import React, { Suspense } from "react";
import "./App.css";
import { Header } from "./Components/common-components/header";
import { Sidebar } from "./Components/common-components/sidebar";
import { BreadcrumbNavigator } from "./Components/common-components/breadcrumbs";
import { AppContextProvider } from "./Context/AppContext";
import { Notification } from "./Components/common-components/notifications";

const LazyApp = React.lazy(
  () => import("./Components/common-components/Lazy/index")
);

function App() {
  return (
      <AppContextProvider>
        <div className="App">
          <Header />
          <div className="flex-container">
            <Sidebar />
            <div className="content-container">
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
      </AppContextProvider>
  );
}

export default App;
