import express from "express";
import {
    authenticateKeycloakUser,
    logout
} from "../controllers/authentication.controller";

const router = express.Router();

// Define routes
router.post("/", authenticateKeycloakUser);
router.post("/logout", logout);
export default router;
