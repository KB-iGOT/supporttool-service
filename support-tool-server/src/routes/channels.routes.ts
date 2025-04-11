import express from "express";
import {
    fetchChannel
} from "../controllers/channels.controller";

const router = express.Router();

// Define routes
router.get("/:id", fetchChannel); // Get all users

export default router;
