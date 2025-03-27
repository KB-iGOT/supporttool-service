const BREADCRUMBSCONFIG = [
  { path: "/home", type: "Home" },
  { path: "/support-users", type: "SupportUsers" },
  { path: "/modules", type: "Modules" },
];

const BREADCRUMBVALUES = {
  Home: [
    { title: "", link: "/home", state: "inactive" },
    { title: "Home", link: "#", state: "active" },
  ],
  SupportUsers: [
    { title: "", link: "/home", state: "inactive" },
    { title: "Support Users", link: "#", state: "active" },
  ],
  Modules: [
    { title: "", link: "/home", state: "inactive" },
    { title: "Modules", link: "#", state: "active" },
  ],
};

const DASHBOARDELEMENTS = [
  {
    title: "Contents",
    link: "/contents",
    description:
      "This feature consists of a list of contents that are available in the IGot environment.",
    allowedRole: ["admin"],
  },
  {
    title: "Courses",
    link: "/courses",
    description:
      "This feature consists of a list of courses that are available in the IGot environment.",
    allowedRole: ["admin"],
  },
  {
    title: "Forms",
    link: "/forms",
    description:
      "This feature consists of a list of forms that are available in the IGot environment.",
    allowedRole: ["admin"],
  },
  {
    title: "Frameworks",
    link: "/frameworks",
    description:
      "This feature consists of a list of frameworks that are available in the IGot environment.",
    allowedRole: ["admin"],
  },
  {
    title: "Organisations",
    link: "/organisations",
    description:
      "This feature consists of a list of organisations that are available in the IGot environment.",
    allowedRole: ["admin"],
  },
  {
    title: "Users",
    link: "/users",
    description:
      "This feature consists of a list of users that have access to the IGot environment.",
    allowedRole: ["admin"],
  },
];

const ADMINELEMENTS = [
  {
    title: "Support Users",
    link: "/support-users",
    description:
      "This feature consists of a list of users that have access to the support tool.",
    allowedRole: ["admin"],
  },
  {
    title: "Modules",
    link: "/modules",
    description:
      "This feature consists of a list of modules that have access to the support tool.",
    allowedRole: ["admin"],
  },
];
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  BREADCRUMBSCONFIG,
  BREADCRUMBVALUES,
  DASHBOARDELEMENTS,
  ADMINELEMENTS,
};
