import express from "express";

import { getUsers, updateUser } from "../controllers/users.controller";

const UsersRoutes = express.Router();

// Define your routes here
UsersRoutes.post("/", getUsers);

UsersRoutes.patch("/:userId", updateUser);

export default UsersRoutes ;