import { z } from "zod";
import { EnvSchema, SigninSchema, SignupSchema } from "../schemas/auth.schemas.js";

export type SignupRequestBody = z.infer<typeof SignupSchema>;

export type SigninRequestBody = z.infer<typeof SigninSchema>;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  age?: number;
  phoneNumber?: string;
  googleId?: string;
}

export interface AuthenticatedUser extends PublicUser {}

export interface AuthSuccessResponse {
  success: true;
  message: string;
  token: string;
  user: PublicUser;
}

export interface ProtectedRouteResponse {
  success: true;
  message: string;
  user: PublicUser;
}

export interface ErrorResponse {
  success: false;
  message: string;
}

export interface JwtPayload {
  userId: string;
}

export type EnvConfig = z.infer<typeof EnvSchema>;

export interface ValidationResult<T> {
  value: T | null;
  errors: string[];
}
