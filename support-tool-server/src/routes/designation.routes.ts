import express from "express";
import { createDesignation, searchDesignations, uploadDesignations, searchCompositeDesignations, deleteDesignation, updateDesignation, createMasterDesignation, searchMasterDesignations } from "../controllers/designation.controller";
import { userSession } from "../helpers/authHelper";
import multer from "multer";

const router = express.Router();

// Set up multer for file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define routes
router.route("/search")
  .post(userSession, searchDesignations);
router.route("/master/search")
  .post(userSession, searchMasterDesignations);
router.route("/composite/search")
  .post(userSession, searchCompositeDesignations);
router.route("/create/term")
  .post(userSession, createDesignation);
router.route("/create")
  .post(userSession, createMasterDesignation);
router.route("/upload")
  .post(userSession, upload.single('file'), uploadDesignations);
router.route("/delete/:id")
  .delete(userSession, deleteDesignation);
router.route("/update")
  .put(userSession, updateDesignation);

export default router;