import express from "express";
import {
  getAllModules
} from "../controllers/dashboard.controller";
import { userSession } from "../helpers/authHelper";

const router = express.Router();

// Define routes
router.route("/")
.get(userSession, getAllModules); 
export default router;
