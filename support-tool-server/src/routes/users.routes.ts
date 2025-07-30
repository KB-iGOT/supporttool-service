import express from "express";

import { getUsers, updateUser, getUserByEmail, assignUserRoles, getUserEnrollList, getCertificate, reissueCertificate, getUserEventEnrollList, createUsers, migrateUser, resetUserPassword, blockUser, unblockUser, updateSuperUser, updateUserRoles } from "../controllers/users.controller";
import { userSession } from "../helpers/authHelper";

const UsersRoutes = express.Router();
// Define your routes here
UsersRoutes.route("/").post(userSession, getUsers);
UsersRoutes.route("/email").post(userSession, getUserByEmail);

UsersRoutes.route("/role/assign").post(userSession, assignUserRoles);
UsersRoutes.route("/role/update").post(userSession, updateUserRoles );
UsersRoutes.route("/content/enrollment/list/:userId").get(userSession, getUserEnrollList);
UsersRoutes.route("/event/enrollment/list/:userId").get(userSession, getUserEventEnrollList);
UsersRoutes.route("/certs/download/:certId").get(userSession, getCertificate);
UsersRoutes.route("/cert/reissue").post(userSession, reissueCertificate);
UsersRoutes.route("/profileDetails/createUser").post(userSession, createUsers); // This route is used to create a user profile
UsersRoutes.route("/migrate").patch(userSession, migrateUser,() => {
  console.log("User migration route hit");
}); 
UsersRoutes.route("/block").post(userSession, blockUser);
UsersRoutes.route("/unblock").post(userSession, unblockUser);
UsersRoutes.route("/update/:userId").patch(userSession, updateSuperUser);
UsersRoutes.route("/:userId").patch(userSession, updateUser);
UsersRoutes.route("/password/reset").post(userSession, resetUserPassword);

export default UsersRoutes ;

// 108367997