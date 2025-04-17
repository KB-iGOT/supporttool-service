import express from "express";

import { getConfig, getList, updateConfig } from "../controllers/system-settings.controller";

const SystemSettingsRoutes = express.Router();

// Define your routes here
SystemSettingsRoutes.get("/", getList);
SystemSettingsRoutes.get("/:id", getConfig);
SystemSettingsRoutes.post("/update", updateConfig);

export default SystemSettingsRoutes ;