import express from "express";

import { getConfig, getList } from "../controllers/system-settings.controller";

const SystemSettingsRoutes = express.Router();

// Define your routes here
SystemSettingsRoutes.get("/", getList);
SystemSettingsRoutes.get("/:id", getConfig);

export default SystemSettingsRoutes ;