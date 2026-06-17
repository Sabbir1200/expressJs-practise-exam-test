import type { NextFunction, Request, Response } from "express";
import sendResponse from "../utility";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";
import type { TCustomUser } from ".";

const auth = (...roles : any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // console.log(req.body)
    try {
      const token = req.headers.authorization;
      
    //  console.log(req.headers.authorization)
      if (!token) {
        return sendResponse(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized access! Token is missing.",
        });
      }

      
      const decoded = jwt.verify(
        token,
        config.jwt_secret as string,
      ) as TCustomUser;

      
      const userData = await pool.query(
        `SELECT * FROM users WHERE email=$1`,
        [decoded.email],
      );

      
      if (userData.rows.length === 0) {
        return sendResponse(res, {
          statusCode: 404,
          success: false,
          message: "User not found",
        });
      }

      const user = userData.rows[0];

      
      if (roles.length && !roles.includes(user.role)) {
        return sendResponse(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden access",
        });
      }

      
      req.user = user as TCustomUser;
     

     
      next();

    } catch (error: any) {
      
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: error.message || "Invalid or expired token",
      });
    }
  };
};

export default auth;