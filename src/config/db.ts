import mongoose from "mongoose";

export const connectDB = async (dbUri: string): Promise<void> => {
  if (dbUri.trim() === "") {
    throw new Error("DB_URI environment variable is required");
  }

  try {
    const connection = await mongoose.connect(dbUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    console.log(`MongoDB database: ${connection.connection.name}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB connection error";
    console.error(`MongoDB connection failed: ${message}`);
    process.exit(1);
  }
};
