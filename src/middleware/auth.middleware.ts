import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User, type UserHydratedDocument } from "../models/user.model.js";
import type { ErrorResponse, JwtPayload, PublicUser } from "../types/auth.types.js";

const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (authHeader === undefined) {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer" || parts[1] === undefined || parts[1].trim() === "") {
    return null;
  }

  return parts[1];
};

const isJwtPayload = (decoded: unknown): decoded is JwtPayload => {
  return (
    typeof decoded === "object" &&
    decoded !== null &&
    "userId" in decoded &&
    typeof decoded.userId === "string" &&
    decoded.userId.length > 0
  );
};

const toPublicUser = (user: UserHydratedDocument): PublicUser => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    age: user.age,
    phoneNumber: user.phoneNumber
  };
};

const unauthorized = (res: Response<ErrorResponse>, message: string): Response<ErrorResponse> => {
  return res.status(401).json({
    success: false,
    message
  });
};

export const protect = async (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): Promise<Response<ErrorResponse> | void> => {
  try {
    const token = getTokenFromRequest(req);

    if (token === null) {
      return unauthorized(res, "Access denied. No valid bearer token provided");
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (jwtSecret === undefined || jwtSecret.trim() === "") {
      throw new Error("JWT_SECRET environment variable is required");
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (!isJwtPayload(decoded)) {
      return unauthorized(res, "Access denied. Invalid token payload");
    }

    const user = await User.findById(decoded.userId).select("-password").exec();

    if (user === null) {
      return unauthorized(res, "Access denied. User not found");
    }

    req.user = toPublicUser(user);
    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      return unauthorized(res, "Access denied. Token has expired");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return unauthorized(res, "Access denied. Invalid or malformed token");
    }

    next(error);
  }
};
