import React, { useContext } from "react";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import CONSTANTS from "../../../Config/Constants";
import HomeTwoToneIcon from "@mui/icons-material/HomeTwoTone";
import { appContextType } from "../../../types";
import { AppContext } from "../../../Context/AppContext";
import { useLocation, Link as RouterLink } from "react-router-dom";

interface IBreaadCrumb {
  title: string;
  link: string;
  state: string;
}

export const BreadcrumbNavigator: React.FC = () => {
  const { isLoggedIn } = useContext(AppContext) as appContextType;
  // Use useLocation hook to get current path and trigger re-render on route change
  const location = useLocation();

  // Get breadcrumb config based on current path from location
  const config = isLoggedIn
    ? CONSTANTS.BREADCRUMBSCONFIG.filter(
        (item) => item.path === location.pathname
      ).map(
        (item) =>
          CONSTANTS.BREADCRUMBVALUES[
            item.type as keyof typeof CONSTANTS.BREADCRUMBVALUES
          ]
      )[0]
    : [];

  // For debugging - remove this in production
  console.log("Current path:", location.pathname);
  console.log("Breadcrumb config:", config);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Breadcrumbs aria-label="breadcrumb">
      {config  && config.map((item: IBreaadCrumb, index: number) =>
        item.state === "active" ? (
          <Typography key={index} sx={{ color: "text.primary" }}>
            {item.title}
          </Typography>
        ) : item.title !== "" ? (
          // Use RouterLink instead of href for client-side navigation
          <Link
            key={index}
            underline="hover"
            color="inherit"
            component={RouterLink}
            to={item.link}
          >
            {item.title}
          </Link>
        ) : (
          <Link
            key={index}
            underline="hover"
            color="inherit"
            component={RouterLink}
            to={item.link}
          >
            <HomeTwoToneIcon />
          </Link>
        )
      )}
    </Breadcrumbs>
  );
};