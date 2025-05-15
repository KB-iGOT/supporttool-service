import express from "express";
import {
    fetchOrganisations,
    fetchOrganisationByName,
    deleteOrganisationById
} from "../controllers/organisations.controller";
import { userSession } from "../helpers/authHelper";

const router = express.Router();

// Define routes
router.route("/")
  .get(userSession, fetchOrganisations);

router.route("/:id")
.get(userSession, fetchOrganisationByName);
router.route("/delete/:id")
.get(userSession, deleteOrganisationById);
export default router;
