import { Request, Response } from "express";
import pool from "../config/database";
import { RequestHandler } from "express";
import axios from 'axios';

// 🚀 **Get All Users**
export const fetchChannel: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const data = req.body;
    console.log(req.session);
  };