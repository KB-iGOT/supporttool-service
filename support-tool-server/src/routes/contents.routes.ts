import express from "express";
import multer from "multer";

import { getContents,retireContents, createPrivateContents, uploadPrivateContentFile } from "../controllers/contents.controller";
import { userSession } from "../helpers/authHelper";

const ContentsRoutes = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB file size limit
  }
});

// Define your routes here
ContentsRoutes.route("/")
  .post(userSession, getContents);

ContentsRoutes.route("/retire/:id")
.get(userSession, retireContents,()=>{
  console.log('hjghjzdgfghfdgfj')
});

ContentsRoutes.route("/private/create")
  .post(userSession, createPrivateContents);

  ContentsRoutes.route("/private/upload/:id")
  .post(userSession,upload.single("data"), uploadPrivateContentFile);

export default ContentsRoutes ;