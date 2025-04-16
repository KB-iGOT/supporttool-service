import express from "express";

import { getForms } from "../controllers/forms.controller";

const FormsRoutes = express.Router();

// Define your routes here
FormsRoutes.post("/", getForms);

export default FormsRoutes ;