import express from "express";

import { getContents } from "../controllers/contents.controller";
import { userSession } from "../helpers/authHelper";

const ContentsRoutes = express.Router();

// Define your routes here
ContentsRoutes.route("/")
  .post(userSession, getContents);

export default ContentsRoutes ;