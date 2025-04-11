import React from "react";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import CONSTANTS from "../../../Config/Constants";
import HomeTwoToneIcon from "@mui/icons-material/HomeTwoTone";

interface IBreaadCrumb {
  title: string;
  link: string;
  state: string;
}

export const BreadcrumbNavigator: React.FC = () => {
  const isLogin = window.location.pathname.includes('/login');
  const config = !isLogin ? CONSTANTS.BREADCRUMBSCONFIG.filter(
    (item) => item.path === window.location.pathname
  ).map(
    (item) =>
      CONSTANTS.BREADCRUMBVALUES[
        item.type as keyof typeof CONSTANTS.BREADCRUMBVALUES
      ]
  )[0]: [];

  return (
    !isLogin ? <Breadcrumbs aria-label="breadcrumb">
      {config.map((item: IBreaadCrumb, index: number) =>
        item.state === "active" ? (
          <Typography key={index} sx={{ color: "text.primary" }}>
            {item.title}
          </Typography>
        ) : item.title !== "" ? (
          <Link key={index} underline="hover" color="inherit" href={item.link}>
            {item.title}
          </Link>
        ) : (
          <Link key={index} underline="hover" color="inherit" href={item.link}>
            <HomeTwoToneIcon />
          </Link>
        )
      )}
    </Breadcrumbs> : null
  );
};
