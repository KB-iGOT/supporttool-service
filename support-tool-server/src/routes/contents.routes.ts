import express from "express";
import multer from "multer";

import { getContents,retireContents, createPrivateContents, uploadPrivateContentFile, updatePrivateContent, deletePrivateContent, readPrivateContent, getContentHierarchy, updateContentHierarchy } from "../controllers/contents.controller";
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
.delete(userSession, retireContents,()=>{
  console.log('hjghjzdgfghfdgfj')
});

ContentsRoutes.route("/private/create")
  .post(userSession, createPrivateContents);

  ContentsRoutes.route("/private/upload/:id")
  .post(userSession,upload.single("data"), uploadPrivateContentFile);
  ContentsRoutes.route("/private/update/:id")
  .patch(userSession,updatePrivateContent);
  ContentsRoutes.route("/private/retire/:id")
  .delete(userSession,deletePrivateContent)
  ContentsRoutes.route("/private/read/:id")
  .get(userSession,readPrivateContent)
  ContentsRoutes.route("/hierarchy/:identifier")
  .get(userSession,getContentHierarchy);

  ContentsRoutes.route("/update/hierarchy/:identifier")
  .patch(userSession, updateContentHierarchy);


export default ContentsRoutes ;