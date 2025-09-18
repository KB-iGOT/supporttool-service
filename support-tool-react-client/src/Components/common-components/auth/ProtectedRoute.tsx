import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../../Context/AppContext';
import { appContextType } from '../../../types';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useContext(AppContext) as appContextType;
  const location = useLocation();

  if (!isLoggedIn) {
    // If the user is not logged in, redirect them to the login page.
    // We also save the location they were trying to access, so we can redirect them back after a successful login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;