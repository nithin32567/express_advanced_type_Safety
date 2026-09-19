import bcrypt from "bcrypt";
import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

export interface UserDocument {
  name: string;
  email: string;
  password: string;
  age: number;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserHydratedDocument = HydratedDocument<UserDocument>;

const SALT_ROUNDS = 10;

const userSchema = new Schema<UserDocument, Model<UserDocument>>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [50, "Name cannot be more than 50 characters long"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [4, "Email must be at least 4 characters long"],
      maxlength: [50, "Email cannot be more than 50 characters long"],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
      validate: {
        validator(value: string): boolean {
          return /^[A-Za-z]/.test(value);
        },
        message: "Password must start with a letter"
      }
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [1, "Age must be at least 1"],
      max: [120, "Age cannot be more than 120"]
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\d{10}$/, "Phone number must be exactly 10 digits"]
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function hashPassword(this: UserHydratedDocument): Promise<void> {
  if (!this.isNew && !this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

export const User = mongoose.model<UserDocument>("User", userSchema);
