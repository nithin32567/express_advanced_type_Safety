import cors from "cors";
import dotenv from "dotenv";
import express, { type ErrorRequestHandler } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { loadConfig } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import type { ErrorResponse } from "./types/auth.types.js";

dotenv.config();

const config = loadConfig();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", authRoutes);
app.use("/api/auth", authRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  } satisfies ErrorResponse);
});

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof jwt.TokenExpiredError) {
    res.status(401).json({
      success: false,
      message: "Access denied. Token has expired"
    } satisfies ErrorResponse);
    return;
  }

  if (error instanceof jwt.JsonWebTokenError) {
    res.status(401).json({
      success: false,
      message: "Access denied. Invalid or malformed token"
    } satisfies ErrorResponse);
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      message: Object.values(error.errors).map((validationError) => validationError.message).join(", ")
    } satisfies ErrorResponse);
    return;
  }

  const logMessage = error instanceof Error ? error.message : "Unknown server error";
  console.error(`Unhandled error: ${logMessage}`);

  res.status(500).json({
    success: false,
    message: config.nodeEnv === "production" ? "Internal server error" : logMessage
  } satisfies ErrorResponse);
};

app.use(errorHandler);

await connectDB(config.dbUri);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
