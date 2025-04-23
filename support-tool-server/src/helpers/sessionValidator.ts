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
    next();
  } else {
    res.redirect("/login"); // Redirect to login page if not authenticated
  }
};