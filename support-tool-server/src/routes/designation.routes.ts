import express from "express";
import { createDesignation, searchDesignations, uploadDesignations } from "../controllers/designation.controller";
import { userSession } from "../helpers/authHelper";
import multer from "multer";

const router = express.Router();

// Set up multer for file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define routes
router.route("/search")
  .post(userSession, searchDesignations);
router.route("/create/term")
  .post(userSession, createDesignation);
router.route("/upload")
  .post(userSession, upload.single('file'), uploadDesignations);

export default router;