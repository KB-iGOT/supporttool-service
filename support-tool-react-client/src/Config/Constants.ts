const BREADCRUMBSCONFIG = [
  { path: "/home", type: "Home" },
  { path: "/support-users", type: "SupportUsers" },
  { path: "/modules", type: "Modules" },
  { path: "/contents", type: "Contents" },
  { path: "/users", type: "Users" },
  { path: "/forms", type: "Forms" },
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
  Contents: [
    { title: "", link: "/home", state: "inactive" },
    { title: "Contents", link: "#", state: "active" },
  ],
  Users: [
    { title: "", link: "/home", state: "inactive" },
    { title: "Users", link: "#", state: "active" },
  ],
  Forms: [
    { title: "", link: "/home", state: "inactive" },
    { title: "Forms", link: "#", state: "active" },
  ],
};



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
  ADMINELEMENTS,
};
