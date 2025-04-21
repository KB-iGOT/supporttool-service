import React, { useContext } from "react";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
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

  // Construct breadcrumbs dynamically based on the URL
  const pathSegments = location.pathname
    .split("/")
    .filter((segment) => segment);
  const config = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
    return {
      title: segment.charAt(0).toUpperCase() + segment.slice(1),
      link: path,
      state: index === pathSegments.length - 1 ? "active" : "inactive",
    };
  });

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link underline="hover" color="inherit" component={RouterLink} to="/home">
        <HomeTwoToneIcon />
      </Link>
      {config &&
        config.map((item: IBreaadCrumb, index: number) =>
          item.state === "active" ? (
            <Typography key={index} sx={{ color: "text.primary" }}>
              {item.title}
            </Typography>
          ) : (
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
          )
        )}
    </Breadcrumbs>
  );
};
