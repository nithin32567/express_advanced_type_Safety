import type { EnvConfig } from "../types/auth.types.js";

const parsePort = (value: string | undefined): number => {
  if (value === undefined || value.trim() === "") {
    return 5000;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return parsed;
};

export const loadConfig = (): EnvConfig => {
  const dbUri = process.env.DB_URI;
  const jwtSecret = process.env.JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (dbUri === undefined || dbUri.trim() === "") {
    throw new Error("DB_URI environment variable is required");
  }

  if (jwtSecret === undefined || jwtSecret.trim() === "") {
    throw new Error("JWT_SECRET environment variable is required");
  }

  if (nodeEnv === "production" && jwtSecret === "replace_with_a_strong_secret") {
    throw new Error("JWT_SECRET must be changed before running in production");
  }

  return {
    port: parsePort(process.env.PORT),
    dbUri,
    jwtSecret,
    nodeEnv
  };
};
