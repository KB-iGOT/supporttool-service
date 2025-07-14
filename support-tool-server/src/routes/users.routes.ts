import express from "express";

import { getUsers, updateUser, getUserByEmail, assignUserRoles,  } from "../controllers/users.controller";
import { userSession } from "../helpers/authHelper";

const UsersRoutes = express.Router();
// Define your routes here
UsersRoutes.route("/").post(userSession, getUsers);
UsersRoutes.route("/:userId").patch(userSession, updateUser);
UsersRoutes.route("/email").post(userSession, getUserByEmail);

UsersRoutes.route("/role/assign").post(userSession, assignUserRoles);
export default UsersRoutes ;