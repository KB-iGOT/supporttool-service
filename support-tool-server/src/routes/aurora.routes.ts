import express from "express";
import { getDashboardOverview } from "../controllers/aurora.controller";
import { userSession } from "../helpers/authHelper";

const router = express.Router();

router.route("/dashboard/overview").get(userSession, getDashboardOverview);

export default router;
