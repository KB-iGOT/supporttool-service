import express from "express";
import {
  getAllModules
} from "../controllers/dashboard.controller";

const router = express.Router();

// Define routes
router.get("/", getAllModules); // Get all users

export default router;
