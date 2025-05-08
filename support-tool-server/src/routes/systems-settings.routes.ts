import express from "express";

import {
  getConfig,
  getList,
  updateConfig,
} from "../controllers/system-settings.controller";
import { userSession } from "../helpers/authHelper";

const SystemSettingsRoutes = express.Router();

// Define your routes here
SystemSettingsRoutes.route("/").get(userSession, getList);
SystemSettingsRoutes.route("/:id").get(userSession, getConfig);
SystemSettingsRoutes.route("/update").post(userSession, updateConfig);

export default SystemSettingsRoutes;
