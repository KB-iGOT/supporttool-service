import express from "express";

import { getUsers, updateUser, getUserByEmail, assignUserRoles, getUserEnrollList, getCertificate, reissueCertificate, getUserEventEnrollList, createUsers, migrateUser, resetUserPassword, blockUser, unblockUser, updateSuperUser, updateUserRoles, updateUserExt, fetchGroups, fetchCadreData, fetchMasterLanguages, deactivateBulkUser, migrateBulkUser, migrateBulkUserV2, getCBPlan, getAssignedCAP, getCBPlanDetails, getEnrollmentDetails } from "../controllers/users.controller";
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
UsersRoutes.route("/deactivate-bulk").post(userSession, deactivateBulkUser);
UsersRoutes.route("/migrate-bulk").post(userSession, migrateBulkUser);
UsersRoutes.route("/migrate-bulk-v2").post(userSession, migrateBulkUserV2);
UsersRoutes.route("/unblock").post(userSession, unblockUser);
UsersRoutes.route("/update/:userId").patch(userSession, updateSuperUser);
UsersRoutes.route("/:userId").patch(userSession, updateUser);
UsersRoutes.route("/admin/extPatch").post(userSession, updateUserExt);
UsersRoutes.route("/password/reset").post(userSession, resetUserPassword);
UsersRoutes.route("/v1/groups").get(userSession, fetchGroups);
UsersRoutes.route("/v1/cadre-config").get(userSession, fetchCadreData);
UsersRoutes.route("/v1/master-languages").get(userSession, fetchMasterLanguages);
UsersRoutes.route("/v1/cbplan").post(userSession, getCBPlan);
UsersRoutes.route("/v2/assigned-cap").post(userSession, getAssignedCAP);
UsersRoutes.route("/v2/cbplan/:planId").get(userSession, getCBPlanDetails);
UsersRoutes.route("/enrollment/details/:userId").post(userSession, getEnrollmentDetails);

export default UsersRoutes ;

// 108367997