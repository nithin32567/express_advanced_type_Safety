import bcrypt from "bcrypt";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User, type UserHydratedDocument } from "../models/user.model.js";
import type {
  AuthSuccessResponse,
  ErrorResponse,
  JwtPayload,
  ProtectedRouteResponse,
  PublicUser,
  SigninRequestBody,
  SignupRequestBody,
  ValidationResult
} from "../types/auth.types.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\d{10}$/;
const passwordPattern = /^[A-Za-z]/;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const normalizeString = (value: unknown): string | null => {
  return typeof value === "string" ? value.trim() : null;
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

const createToken = (payload: JwtPayload): string => {
  const jwtSecret = process.env.JWT_SECRET;

  if (jwtSecret === undefined || jwtSecret.trim() === "") {
    throw new Error("JWT_SECRET environment variable is required");
  }

  return jwt.sign(payload, jwtSecret, {
    expiresIn: "7d"
  });
};

const validateSignupBody = (body: unknown): ValidationResult<SignupRequestBody> => {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return {
      value: null,
      errors: ["Request body must be a JSON object"]
    };
  }

  const name = normalizeString(body.name);
  const email = normalizeString(body.email)?.toLowerCase() ?? null;
  const password = typeof body.password === "string" ? body.password : null;
  const phoneNumber = normalizeString(body.phoneNumber);
  const age = typeof body.age === "number" ? body.age : Number(body.age);

  if (name === null || name.length < 3 || name.length > 50) {
    errors.push("Name must be between 3 and 50 characters");
  }

  if (email === null || email.length < 4 || email.length > 50 || !emailPattern.test(email)) {
    errors.push("Email must be a valid email address between 4 and 50 characters");
  }

  if (password === null || password.length < 8 || !passwordPattern.test(password)) {
    errors.push("Password must be at least 8 characters and start with a letter");
  }

  if (!Number.isInteger(age) || age < 1 || age > 120) {
    errors.push("Age must be an integer between 1 and 120");
  }

  if (phoneNumber === null || !phonePattern.test(phoneNumber)) {
    errors.push("Phone number must be exactly 10 digits");
  }

  if (errors.length > 0 || name === null || email === null || password === null || phoneNumber === null) {
    return {
      value: null,
      errors
    };
  }

  return {
    value: {
      name,
      email,
      password,
      age,
      phoneNumber
    },
    errors: []
  };
};

const validateSigninBody = (body: unknown): ValidationResult<SigninRequestBody> => {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return {
      value: null,
      errors: ["Request body must be a JSON object"]
    };
  }

  const email = normalizeString(body.email)?.toLowerCase() ?? null;
  const password = typeof body.password === "string" ? body.password : null;

  if (email === null || !emailPattern.test(email)) {
    errors.push("Email must be a valid email address");
  }

  if (password === null || password.length === 0) {
    errors.push("Password is required");
  }

  if (errors.length > 0 || email === null || password === null) {
    return {
      value: null,
      errors
    };
  }

  return {
    value: {
      email,
      password
    },
    errors: []
  };
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
    const validation = validateSignupBody(req.body);

    if (validation.value === null) {
      return sendError(res, 400, validation.errors.join(", "));
    }

    const existingUser = await User.exists({ email: validation.value.email });

    if (existingUser !== null) {
      return sendError(res, 409, "Email already exists");
    }

    const user = await User.create(validation.value);
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
    const validation = validateSigninBody(req.body);

    if (validation.value === null) {
      return sendError(res, 400, validation.errors.join(", "));
    }

    const user = await User.findOne({ email: validation.value.email }).select("+password").exec();

    if (user === null) {
      return sendError(res, 401, "Invalid email or password");
    }

    const isPasswordMatch = await bcrypt.compare(validation.value.password, user.password);

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
