import mongoose, { Document, Schema } from "mongoose";
import { SalaryRangeValue } from "@/schemas/userInfoSchema";

export type AuthProviderType = "credentials" | "google";
export type SalaryRangeType = SalaryRangeValue;

export interface User extends Document {
  email: string;
  password?: string;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
  isVerified: boolean;
  provider: Array<AuthProviderType>;
  name?: string;
  failedLoginAttempts?: number;
  lastFailedLogin?: Date;
  // User profile info
  phoneNumber?: string;
  isPhoneVerified: boolean;
  salaryRange?: SalaryRangeType;
  informationConsent: boolean;
  promotionalConsent: boolean;
}

const UserSchema: Schema<User> = new Schema({
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true,
    match: [/.+\@.+\..+/, "please use a valid email address"],
  },
  password: {
    type: String,
    required: false,
  },
  verificationCode: {
    type: String,
    required: false,
  },
  verificationCodeExpiry: {
    type: Date,
    required: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  provider: {
    type: [String],
    required: true,
    enum: ["credentials", "google"],
    default: ["credentials"],
  },
  name: {
    type: String,
    required: false,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
    required: false,
  },
  lastFailedLogin: {
    type: Date,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: false,
    sparse: true,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  salaryRange: {
    type: String,
    enum: ["below_5", "5_to_10", "10_to_20", "20_to_50", "above_50"],
    required: false,
  },
  informationConsent: {
    type: Boolean,
    default: true,
  },
  promotionalConsent: {
    type: Boolean,
    default: true,
  },
});

const UserModal =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default UserModal;
