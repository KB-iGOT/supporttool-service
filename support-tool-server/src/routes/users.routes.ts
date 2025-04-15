import express from "express";

import { getUsers } from "../controllers/users.controller";

const UsersRoutes = express.Router();

// Define your routes here
UsersRoutes.post("/", getUsers);

export default UsersRoutes ;