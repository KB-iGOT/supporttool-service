
import express from "express";
import { userSession } from "../helpers/authHelper";
import { getPrivateContent } from "../controllers/private.controller";

const privateRoutes = express.Router();

// Define routes
privateRoutes.route("/search")
  .post(userSession, getPrivateContent);
export default privateRoutes;
