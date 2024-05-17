import { Request, Response, NextFunction } from "express";
import AuthRepository from "../repositories/authRepository";
import UserRepository from "../repositories/userRepository";
import SendApiResponse from "../utils/SendApiResponse";
import { validationResult } from "express-validator";
import createError from "http-errors";
import {
  blacklistAccessToken,
  removeRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "../utils/jwt_helper";
import UserModel from "../models/userModel";
import { validateRequestErrors } from "../utils/validators/validators";
import { getTokenFromHeader } from "../utils/validators/handlers";

export default class AuthServices {
  private authRepo: AuthRepository | null;
  private userRepo: UserRepository | null;
  constructor() {
    this.authRepo = new AuthRepository();
    this.userRepo = new UserRepository();
    this.firebaseSignup = this.firebaseSignup.bind(this);
    this.firebaseLogin = this.firebaseLogin.bind(this);
    this.refreshTokens = this.refreshTokens.bind(this);
    this.logout = this.logout.bind(this);
  }

  async firebaseSignup(req: Request, res: Response, next: NextFunction) {
    try {
      if (!validateRequestErrors(req, next)) return;

      const user = req?.firebaseUser;
      const createdUser = await this.authRepo!.createUser(user!);
      return SendApiResponse(res, 200, createdUser);
    } catch (err) {
      next(createError.InternalServerError(`${err}`));
    }
  }

  async firebaseLogin(req: Request, res: Response, next: NextFunction) {
    try {
      if (!validateRequestErrors(req, next)) return;

      const user = req?.firebaseUser!;
      const fetchedUser = await this.authRepo!.getUserById(user?.uid);

      if (!fetchedUser) next(createError.NotFound());
      else {
        const accessToken = await signAccessToken(
          user?.uid,
          fetchedUser?._id.toString()
        );
        const refreshToken = await signRefreshToken(
          user?.uid,
          fetchedUser?._id.toString()
        );
        return SendApiResponse(res, 200, {
          accessToken,
          refreshToken,
        });
      }
    } catch (err) {
      next(createError.InternalServerError(`${err}`));
    }
  }

  async refreshTokens(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, _id } = req.payload;
      const accessToken = await signAccessToken(userId, _id);
      const refreshToken = await signRefreshToken(userId, _id);
      return SendApiResponse(res, 200, {
        accessToken,
        refreshToken,
      });
    } catch (err) {
      next(createError.InternalServerError(`${err}`));
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, _id } = req.payload;
      const accessToken = getTokenFromHeader(req.headers.authorization);

      await removeRefreshToken(userId, next);
      await blacklistAccessToken(accessToken,0)
      return SendApiResponse(res, 201, null);
    } catch (err) {
      next(createError.InternalServerError(`${err}`));
    }
  }
}
