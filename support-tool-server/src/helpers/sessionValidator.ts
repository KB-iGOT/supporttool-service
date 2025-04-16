import "express-session";
import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    user?: any; // Add the user property to the session
  }
}
import { RequestHandler } from "express";

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};