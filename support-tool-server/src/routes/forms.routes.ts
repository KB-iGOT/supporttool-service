import express from "express";

import { getFacetsForms , getFormRead, createFormData, updateFormData} from "../controllers/forms.controller";
import { userSession } from "../helpers/authHelper";

const FormsRoutes = express.Router();

// Define your routes here
FormsRoutes.route("/facets")
  .get(userSession, getFacetsForms);
FormsRoutes.route("/read")
  .post(userSession, getFormRead,() => {
    console.log("Form read data");
  }
);

FormsRoutes.route("/create")
  .post(userSession, createFormData);

FormsRoutes.route("/update")
.post(userSession, updateFormData);

export default FormsRoutes ;