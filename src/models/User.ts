import mongoose, { Document, Schema } from "mongoose";
import { EmploymentTypeValue, IncomeRangeValue } from "@/schemas/userInfoSchema";

export type AuthProviderType = "credentials" | "google";
export type EmploymentType = EmploymentTypeValue;
export type SalaryRangeType = IncomeRangeValue;

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
  employmentType?: EmploymentType;
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
  employmentType: {
    type: String,
    enum: ["salaried", "self_employed", "retired", "student_unemployed"],
    required: false,
  },
  salaryRange: {
    type: String,
    enum: [
      "below_30k", "30k_to_50k", "50k_to_1l", "1l_to_2_5l", "2_5l_to_5l",
      "below_5l", "5l_to_10l", "10l_to_20l", "20l_to_50l", "50l_to_1cr",
      "1l_to_2l",
    ],
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
