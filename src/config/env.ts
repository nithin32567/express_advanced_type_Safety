import dotenv from "dotenv";
import type { EnvConfig } from "../types/auth.types.js";
import { EnvSchema } from "../schemas/auth.schemas.js";

dotenv.config();

export const loadConfig = (): EnvConfig => {
  const parseResult = EnvSchema.safeParse(process.env);

  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((err) => err.message).join(", ");
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  return parseResult.data;
};
