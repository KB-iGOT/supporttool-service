import express from "express";
import {
  createSupportUser,
  deleteSupportUser,
  getSupportUsers,
  updateSupportUser,
} from "../controllers/support-user.controller";

const router = express.Router();

// Define routes
router.post("/", createSupportUser); // Create user
router.get("/", getSupportUsers); // Get all users
router.put("/:id", updateSupportUser); // Update user
router.delete("/:id", deleteSupportUser); // Delete user

export default router;
