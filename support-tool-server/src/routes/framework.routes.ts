import express from "express";
import {
  fetchFramework,
  updateTerm,
  publishFramework,
  updateTermV2,
} from "../controllers/framework.controller";
import { userSession } from "../helpers/authHelper";

const router = express.Router();

// Define routes
router.route("/v1/read/:id").get(userSession, fetchFramework);
router.route("/v1/term/update/:termId").patch(userSession, updateTerm);
router.route("/v2/term/update/:termId").patch(userSession, updateTermV2);
router.route("/v1/publish/:frameworkId").post(userSession, publishFramework);

export default router;