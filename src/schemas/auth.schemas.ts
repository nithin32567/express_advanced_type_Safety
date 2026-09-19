import { z } from "zod";

export const SignupSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be between 3 and 50 characters")
    .max(50, "Name must be between 3 and 50 characters"),
  email: z
    .string()
    .email("Email must be a valid email address between 4 and 50 characters")
    .min(4, "Email must be a valid email address between 4 and 50 characters")
    .max(50, "Email must be a valid email address between 4 and 50 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters and start with a letter")
    .regex(/^[A-Za-z]/, "Password must be at least 8 characters and start with a letter"),
  age: z.coerce
    .number()
    .int("Age must be an integer between 1 and 120")
    .min(1, "Age must be an integer between 1 and 120")
    .max(120, "Age must be an integer between 1 and 120"),
  phoneNumber: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
});

export const SigninSchema = z.object({
  email: z
    .string()
    .email("Email must be a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
});

export const EnvSchema = z
  .object({
    PORT: z.coerce
      .number()
      .int()
      .min(1, "PORT must be an integer between 1 and 65535")
      .max(65535, "PORT must be an integer between 1 and 65535")
      .default(5000),
    DB_URI: z.string().min(1, "DB_URI environment variable is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET environment variable is required"),
    NODE_ENV: z.string().default("development")
  })
  .refine(
    (data) => {
      if (
        data.NODE_ENV === "production" &&
        data.JWT_SECRET === "replace_with_a_strong_secret"
      ) {
        return false;
      }
      return true;
    },
    {
      message: "JWT_SECRET must be changed before running in production",
      path: ["JWT_SECRET"]
    }
  )
  .transform((data) => ({
    port: data.PORT,
    dbUri: data.DB_URI,
    jwtSecret: data.JWT_SECRET,
    nodeEnv: data.NODE_ENV
  }));
