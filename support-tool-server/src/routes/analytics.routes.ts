import express from "express";
import { userSession } from "../helpers/authHelper";
import { getAnalyticsStats, getUserGrowth } from "../controllers/analytics.controller";

const analyticsRoutes = express.Router();

// Define routes
analyticsRoutes.route("/stats")
.get(userSession, getAnalyticsStats);

analyticsRoutes.route("/user-growth")
.get(userSession, getUserGrowth);

export default analyticsRoutes;
