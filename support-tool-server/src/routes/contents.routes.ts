import express from "express";

import { getContents } from "../controllers/contents.controller";

const ContentsRoutes = express.Router();

// Define your routes here
ContentsRoutes.post("/", getContents);

export default ContentsRoutes ;