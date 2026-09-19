import bcrypt from "bcrypt";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User, type UserHydratedDocument } from "../models/user.model.js";
import { SigninSchema, SignupSchema } from "../schemas/auth.schemas.js";
import type {
  AuthSuccessResponse,
  ErrorResponse,
  JwtPayload,
  ProtectedRouteResponse,
  PublicUser
} from "../types/auth.types.js";

const toPublicUser = (user: UserHydratedDocument): PublicUser => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    age: user.age,
    phoneNumber: user.phoneNumber
  };
};

const createToken = (payload: JwtPayload): string => {
  const jwtSecret = process.env.JWT_SECRET;

  if (jwtSecret === undefined || jwtSecret.trim() === "") {
    throw new Error("JWT_SECRET environment variable is required");
  }

  return jwt.sign(payload, jwtSecret, {
    expiresIn: "7d"
  });
};

const isDuplicateKeyError = (error: unknown): boolean => {
  return error instanceof mongoose.mongo.MongoServerError && error.code === 11000;
};

const getMongooseValidationMessages = (error: unknown): string[] | null => {
  if (!(error instanceof mongoose.Error.ValidationError)) {
    return null;
  }

  return Object.values(error.errors).map((validationError) => validationError.message);
};

const sendError = <TSuccess>(
  res: Response<TSuccess | ErrorResponse>,
  status: number,
  message: string
): Response<TSuccess | ErrorResponse> => {
  return res.status(status).json({
    success: false,
    message
  });
};

export const signup = async (
  req: Request,
  res: Response<AuthSuccessResponse | ErrorResponse>,
  next: NextFunction
): Promise<Response<AuthSuccessResponse | ErrorResponse> | void> => {
  try {
    const validation = SignupSchema.safeParse(req.body);

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((err) => err.message).join(", ");
      return sendError(res, 400, errorMessages);
    }

    const existingUser = await User.exists({ email: validation.data.email });

    if (existingUser !== null) {
      return sendError(res, 409, "Email already exists");
    }

    const user = await User.create(validation.data);
    const publicUser = toPublicUser(user);
    const token = createToken({ userId: publicUser.id });

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      user: publicUser
    });
  } catch (error: unknown) {
    const validationMessages = getMongooseValidationMessages(error);

    if (validationMessages !== null) {
      return sendError(res, 400, validationMessages.join(", "));
    }

    if (isDuplicateKeyError(error)) {
      return sendError(res, 409, "Email already exists");
    }

    next(error);
  }
};

export const signin = async (
  req: Request,
  res: Response<AuthSuccessResponse | ErrorResponse>,
  next: NextFunction
): Promise<Response<AuthSuccessResponse | ErrorResponse> | void> => {
  try {
    const validation = SigninSchema.safeParse(req.body);

    if (!validation.success) {
      const errorMessages = validation.error.issues.map((err) => err.message).join(", ");
      return sendError(res, 400, errorMessages);
    }

    const user = await User.findOne({ email: validation.data.email }).select("+password").exec();

    if (user === null) {
      return sendError(res, 401, "Invalid email or password");
    }

    const isPasswordMatch = await bcrypt.compare(validation.data.password, user.password);

    if (!isPasswordMatch) {
      return sendError(res, 401, "Invalid email or password");
    }

    const publicUser = toPublicUser(user);
    const token = createToken({ userId: publicUser.id });

    return res.status(200).json({
      success: true,
      message: "Signin successful",
      token,
      user: publicUser
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const protectedRoute = (
  req: Request,
  res: Response<ProtectedRouteResponse | ErrorResponse>
): Response<ProtectedRouteResponse | ErrorResponse> => {
  if (req.user === undefined) {
    return sendError(res, 401, "Access denied. Authentication required");
  }

  return res.status(200).json({
    success: true,
    message: "You are authorized to access this protected route",
    user: req.user
  });
};
