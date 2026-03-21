import express from "express";
import multer from "multer";
import { userSession } from "../helpers/authHelper";
import {
  uploadOrgStore,
  getTokenForUser,
} from "../controllers/org-store-upload.controller";

const OrgStoreUploadRoutes = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

// Upload asset (KB Org uses session token; Other Org sends x-selected-user-token header)
OrgStoreUploadRoutes.route("/upload").post(
  userSession,
  upload.single("file"),
  uploadOrgStore
);

// Get impersonation token for a specific user (Other Org flow)
OrgStoreUploadRoutes.route("/user-token/:userId").get(
  userSession,
  getTokenForUser
);

export default OrgStoreUploadRoutes;
