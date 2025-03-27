import express from "express";
import {createModule, getModules, updateModule, deleteModule } from '../controllers/modules.controller';

const router = express.Router();

// Define routes
router.post("/", createModule); // Create module
router.get("/", getModules); // Get all modules
router.put("/:id", updateModule); // Update module
router.delete("/:id", deleteModule); // Delete module

export default router;
