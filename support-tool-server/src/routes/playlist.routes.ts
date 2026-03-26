import express from "express";
import { searchPlaylists, createPlaylist, updatePlaylist, readPlaylist } from "../controllers/playlist.controller";
import { userSession } from "../helpers/authHelper";

const PlaylistRoutes = express.Router();

PlaylistRoutes.route("/search").post(userSession, searchPlaylists);
PlaylistRoutes.route("/create").post(userSession, createPlaylist);
PlaylistRoutes.route("/update").put(userSession, updatePlaylist);
PlaylistRoutes.route("/read/:playlistKey/:orgId").get(userSession, readPlaylist);

export default PlaylistRoutes;
