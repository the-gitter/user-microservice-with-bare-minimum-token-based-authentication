import JWT from "jsonwebtoken";
import createError from "http-errors";
import { NextFunction, Request, Response } from "express";
import "dotenv/config";
import redisClient from "./init_redis";
import { validationResult } from "express-validator";
import { validateRequestErrors } from "./validators/validators";
import { getTokenFromHeader, handleTokenError } from "./validators/handlers";

export const signAccessToken = async (userId: string, _id: string) => {
  return new Promise((resolve, reject) => {
    const payload = {
      userId,
      _id,
    };
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const options = {
      expiresIn: "1h",
      issuer: "thegitter.com",
      audience: userId,
    };

    return JWT.sign(payload, secret!, options, (err, token) => {
      if (err) {
        console.log(err.message);
        reject(createError.InternalServerError());
      }
      resolve(token);
    });
  });
};
export const signRefreshToken = (userId: string, _id: string) => {
  return new Promise((resolve, reject) => {
    const payload = {
      userId,
      _id,
    };
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const options = {
      expiresIn: "1y",
      issuer: "thegitter.com",
      audience: userId,
    };
    return JWT.sign(payload, secret!, options, async (err, token) => {
      if (err) {
        console.log(err.message);
        reject(createError.InternalServerError());
      }
      await redisClient.set(`${userId}`, `${token}`, {
        EX: 365 * 24 * 60 * 60,
      });

      resolve(token);
    });
  });
};

export const verifyAccessToken = async(
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!validateRequestErrors(req, next)) return;

  try {
    const token = getTokenFromHeader(req.headers.authorization);
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
      return next(
        createError.InternalServerError("Access token secret is not defined")
      );
    }

    const blacklisted = await isAccessTokenBlacklisted(token);
    if (blacklisted) {
      return next(createError.Unauthorized('Token has been blacklisted'));
    }

    JWT.verify(
      token,
      secret,
      (
        err: JWT.VerifyErrors | null,
        payload: string | JWT.JwtPayload | undefined
      ) => {
        if (err) {
          return handleTokenError(err, next);
        }
        req.payload = payload as { userId: string; _id: string };
        next();
      }
    );
  } catch (error) {
    next(createError.Unauthorized(`${error}`));
  }
};

export const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!validateRequestErrors(req, next)) return;

  const { refreshToken } = req.body;
  const secret = process.env.REFRESH_TOKEN_SECRET;

  if (!secret) {
    return next(
      createError.InternalServerError("Refresh token secret is not defined")
    );
  }

  try {
    JWT.verify(
      refreshToken,
      secret,
      async (
        err: JWT.VerifyErrors | null,
        payload: string | JWT.JwtPayload | undefined
      ) => {
        if (err) {
          return handleTokenError(err, next);
        }

        const userId = (payload as JWT.JwtPayload).aud as string;

        try {
          const storedToken = await redisClient.get(`${userId}`);
          if (refreshToken === storedToken) {
            req.payload = payload as { userId: string; _id: string };
            next();
          } else {
            next(createError.Unauthorized("Invalid refresh token"));
          }
        } catch (redisError) {
          next(createError.InternalServerError("Redis error: " + redisError));
        }
      }
    );
  } catch (error) {
    next(createError.InternalServerError(`${error}`));
  }
};

export const removeRefreshToken = async (
  userId: string,
  next: NextFunction
) => {
  try {
    await redisClient.del(`${userId}`);
  } catch (err) {
    next(createError.InternalServerError(`${err}`));
  }
};

// black listing tokens
export const blacklistAccessToken =async (token: string, expiration: number) => {
  await redisClient.set(`${token}`, "blacklisted", {
    EX: 365 * 24 * 60 * 60, //replace with number
  });
};

export const isAccessTokenBlacklisted = (token: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await redisClient.get(`${token}`);
      if (result === "blacklisted") resolve(true);
      else resolve(false);
    } catch (err) {
      reject(err);
    }
  });
};
