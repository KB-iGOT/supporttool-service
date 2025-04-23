import express from "express";
import {
    fetchChannel
} from "../controllers/channels.controller";
import { userSession } from "../helpers/authHelper";

const router = express.Router();

// Define routes
router.route("/:id")
  .get(userSession, fetchChannel);

export default router;
