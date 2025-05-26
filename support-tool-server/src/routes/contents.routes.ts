import express from "express";

import { getContents,retireContents } from "../controllers/contents.controller";
import { userSession } from "../helpers/authHelper";

const ContentsRoutes = express.Router();

// Define your routes here
ContentsRoutes.route("/")
  .post(userSession, getContents);

ContentsRoutes.route("/retire/:id")
.get(userSession, retireContents,()=>{
  console.log('hjghjzdgfghfdgfj')
});

export default ContentsRoutes ;