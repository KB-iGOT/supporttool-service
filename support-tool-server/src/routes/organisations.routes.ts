import express from "express";
import {
    fetchOrganisations,
    fetchOrganisationByName,
    deleteOrganisationById,
    fetchOrganisationsData,
    updateOrganisationStatus,
    fetchOrgEligibility,
    upsertOrgEligibility
} from "../controllers/organisations.controller";
import { userSession } from "../helpers/authHelper";

const router = express.Router();

// Define routes
router.route("/")
  .get(userSession, fetchOrganisations);
  
router.route("/search")
  .post(userSession, fetchOrganisationsData);

router.route("/status/update")
  .patch(userSession, updateOrganisationStatus);

router.route("/eligibility/upsert")
  .post(userSession, upsertOrgEligibility);

router.route("/eligibility/:orgId")
  .get(userSession, fetchOrgEligibility);

router.route("/:id")
  .get(userSession, fetchOrganisationByName);
  
router.route("/delete/:id")
  .get(userSession, deleteOrganisationById);
  
export default router;
