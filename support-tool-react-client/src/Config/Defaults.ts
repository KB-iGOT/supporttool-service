const CREATE_USER = {
  userId: "",
  userName: "",
  firstName: "",
  lastName: "",
  roles: "",
};

const CREATE_MODULE = {
  name: "",
  url: "",
  isVisible: false,
  roles: [],
  isAdminModule: false,
  isRootModule: false,
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  CREATE_USER,
  CREATE_MODULE
};
