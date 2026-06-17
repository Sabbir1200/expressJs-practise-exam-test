import type { NextFunction, Request, Response } from "express";
import sendResponse from "../../utility";
import { issuesService } from "./issues.service";

const createIssue = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized! Token is missing or invalid."
      });
    }
    
   
    const result = await issuesService.createIssuesIntoDB(payload, req.user); 
    
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
      error: error
    });
  }
};
const getAllIssues = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.getAllIssuesFromDB();
    res.status(200).json({
      success: true,
      message: "All issues are here",
      data: result.rows,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error,
    });
  }
};
const getSingleIssues = async (req: Request, res: Response) => {
  const { id } = req.params;
  // console.log("this is controller ", id)
  try {
    console.log("this is ", id)
    const result = await issuesService.singleIssuesFromDB(id);
    if (result.rows.length === 0) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "User Not Found",
        data: null,
      });
    }
    res.status(200).json({
      success: true,
      message: "All issues are here",
      data: result.rows[0],
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
       data: null,
    });
  }
};

const updateIssues = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user as { id: number; role: "maintainer" | "contributor" };
  try {
    const result = await issuesService.updateIssuesFromDB(
      id as string,
      req.body,
      user,
    );
    if (result.rows.length === 0) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "User Not Found",
        data: null,
      });
    }
    res.status(200).json({
      success: true,
      message: "All issues are here",
      data: result.rows,
    });
  } catch (error: any) {
    console.log("eroor")
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error,
    });
  }
};

export const issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssues,
  updateIssues
};
