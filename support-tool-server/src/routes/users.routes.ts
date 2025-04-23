import express from "express";

import { getUsers, updateUser } from "../controllers/users.controller";
import { userSession } from "../helpers/authHelper";

const UsersRoutes = express.Router();
// Define your routes here
UsersRoutes.route("/").post(userSession, getUsers);
UsersRoutes.route("/:userId").patch(userSession, updateUser);

export default UsersRoutes ;