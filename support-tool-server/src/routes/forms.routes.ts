import express from "express";

import { getForms } from "../controllers/forms.controller";
import { userSession } from "../helpers/authHelper";

const FormsRoutes = express.Router();

// Define your routes here
FormsRoutes.route("/")
  .get(userSession, getForms);

export default FormsRoutes ;