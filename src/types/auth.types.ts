export interface SignupRequestBody {
  name: string;
  email: string;
  password: string;
  age: number;
  phoneNumber: string;
}

export interface SigninRequestBody {
  email: string;
  password: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  age: number;
  phoneNumber: string;
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

export interface EnvConfig {
  port: number;
  dbUri: string;
  jwtSecret: string;
  nodeEnv: string;
}

export interface ValidationResult<T> {
  value: T | null;
  errors: string[];
}
