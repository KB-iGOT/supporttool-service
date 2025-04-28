import express from "express";
import {
    fetchOrganisations
} from "../controllers/organisations.controller";
import { userSession } from "../helpers/authHelper";

const router = express.Router();

// Define routes
router.route("/")
  .get(userSession, fetchOrganisations);

export default router;
