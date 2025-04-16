import React, { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { appContextType } from "../../../types";
import { AppContext } from "../../../Context/AppContext";

type ProtectedRouteProps = {
  children: JSX.Element;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoggedIn } = useContext(
          AppContext,
        ) as appContextType;

        console.log(isLoggedIn);

  // If the user is not logged in, redirect to the login page
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // If the user is logged in, render the child component
  return children;
};

export default ProtectedRoute;