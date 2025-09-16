import express from "express";
import {
    searchCompetencyThemes,
    searchCompetencySubThemes,
} from "../controllers/competency.controller";
import { userSession } from "../helpers/authHelper";

const competencyRoutes = express.Router();

competencyRoutes.route("/competencyTheme/search").post(userSession, searchCompetencyThemes);
competencyRoutes.route("/competencySubTheme/search").post(userSession, searchCompetencySubThemes);

export default competencyRoutes;