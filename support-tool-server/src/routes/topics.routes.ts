import express from "express";
import { getTopics, createTopic, updateTopic, deleteTopic } from "../controllers/topics.controller";
import { userSession } from "../helpers/authHelper";

const TopicsRoutes = express.Router();

// Define routes
TopicsRoutes.route("/list").post(userSession, getTopics);
TopicsRoutes.route("/create").post(userSession, createTopic);
TopicsRoutes.route("/update").put(userSession, updateTopic);
TopicsRoutes.route("/delete").delete(userSession, deleteTopic);

export default TopicsRoutes;
