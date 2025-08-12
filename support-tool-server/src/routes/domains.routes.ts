import express from "express";
import { userSession } from "../helpers/authHelper";
import { addDomain, deleteDomain, fetchDomains } from "../controllers/domains.controller";

const domainRoutes = express.Router();

// Define routes
domainRoutes.route("/")
  .get(userSession, fetchDomains);

domainRoutes.route("/add")
.post(userSession, addDomain, () => {
  console.log("Domain added successfully");
}); 

domainRoutes.route("/delete/:id")
  .post(userSession, deleteDomain);

export default domainRoutes;
