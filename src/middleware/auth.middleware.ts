import { standardResponse } from "@utils/responses";
import { Request, Response, NextFunction } from "express";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(401).json(standardResponse({ isSuccess: false, res, message: "Unauthorized" }));
    return;
  }
};
