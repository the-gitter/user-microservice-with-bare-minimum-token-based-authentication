import { body, header, validationResult } from "express-validator";
import { NextFunction, Request } from "express";
import createError from "http-errors";

export const refreshTokenValidator = [
  body("refreshToken").exists().withMessage("Please provide proper content"),
];

export const validateRequestErrors = (req: Request, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    next(createError.NotAcceptable(errorMessage));
    return false;
  }
  return true;
};
