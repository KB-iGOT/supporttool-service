import express from "express";
import {
  getFormsConfigList,
  getFormsConfigById,
  updateFormsConfig,
  createFormsConfig,
} from "../controllers/forms-config.controller";
import { userSession } from "../helpers/authHelper";

const FormsConfigRoutes = express.Router();

// Define routes
FormsConfigRoutes.route("/list").get(userSession, getFormsConfigList);
FormsConfigRoutes.route("/read/:id").get(userSession, getFormsConfigById);
FormsConfigRoutes.route("/update").put(userSession, updateFormsConfig);
FormsConfigRoutes.route("/create").post(userSession, createFormsConfig);

export default FormsConfigRoutes;
