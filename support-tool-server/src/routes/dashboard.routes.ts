import express from "express";
import {
  getAdminModules
} from "../controllers/dashboard.controller";

const router = express.Router();

// Define routes
router.get("/", getAdminModules); // Get all users

export default router;
