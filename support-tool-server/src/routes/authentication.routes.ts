import express from "express";
import {
    authenticateKeycloakUser,
    logout,
    getCurrentUserSession
} from "../controllers/authentication.controller";
import { userSession } from "../helpers/authHelper";

const router = express.Router();

// Define routes
router.post("/", authenticateKeycloakUser);
router.post("/logout", logout);
router.get("/session", userSession, getCurrentUserSession);
export default router;
