  import express, { NextFunction, Router, Request, Response } from "express";
  import AuthServices from "../services/authService";
  import firebaseMiddleware, {
    checkIfUserAlearyExists,
    bearerTokenValidator,
  } from "../middlewares/firebaseMiddleware";
  import { refreshTokenValidator } from "../utils/validators/validators";
  import { verifyAccessToken, verifyRefreshToken } from "../utils/jwt_helper";
  import SendApiResponse from "../utils/SendApiResponse";

  const authServices = new AuthServices();
  const authRouter = Router();

  authRouter.post(
    "/firebase-singup",
    bearerTokenValidator,
    firebaseMiddleware,
    checkIfUserAlearyExists,
    authServices.firebaseSignup
  );
  authRouter.post(
    "/firebase-login",
    bearerTokenValidator,
    firebaseMiddleware,
    authServices.firebaseLogin
  );
  authRouter.post(
    "/refresh-tokens",
    refreshTokenValidator,
    verifyRefreshToken,
    authServices.refreshTokens
  );
  authRouter.post(
    "/logout",
    bearerTokenValidator,
    verifyAccessToken,
    authServices.logout
  );

  authRouter.get(
    "/profile",
    bearerTokenValidator,
    verifyAccessToken,
    (req: Request, res: Response, next: NextFunction) => {
      return SendApiResponse(res, 200, req.payload);
    }
  ); 

  export default authRouter;
