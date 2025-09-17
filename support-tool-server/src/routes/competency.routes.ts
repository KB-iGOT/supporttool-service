import express from "express";
import {
    searchCompetencyThemes,
    searchCompetencySubThemes,
    createCompetencyTheme,
    createCompetencySubTheme,
} from "../controllers/competency.controller";
import { userSession } from "../helpers/authHelper";

const competencyRoutes = express.Router();

competencyRoutes.route("/competencyTheme/search").post(userSession, searchCompetencyThemes);
competencyRoutes.route("/competencySubTheme/search").post(userSession, searchCompetencySubThemes);
competencyRoutes.route("/competencyTheme/create").post(userSession, createCompetencyTheme);
competencyRoutes.route("/competencySubTheme/create").post(userSession, createCompetencySubTheme);

export default competencyRoutes;