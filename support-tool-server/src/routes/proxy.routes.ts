import express from "express";
import { proxyRequest } from "../controllers/proxy.controller";
import { userSession } from "../helpers/authHelper";

const proxyRoutes = express.Router();

// Define routes
proxyRoutes.route("/")
  .post(userSession, proxyRequest,() => {
    console.log("Proxy request handled");
  });
  
export default proxyRoutes;
