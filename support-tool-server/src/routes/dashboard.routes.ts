import express from "express";
import {
  getAllModules,
} from "../controllers/dashboard.controller";
import { getSubModules } from "../controllers/dashboard.controller";
import { userSession } from "../helpers/authHelper";

const router = express.Router();

// Define routes
router.route("/")
.get(userSession, getAllModules);

router.route("/submodules").get(userSession, getSubModules);

export default router;
