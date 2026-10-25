import mongoose, { Document, Schema } from "mongoose";
import { EmploymentTypeValue, IncomeRangeValue } from "@/schemas/userInfoSchema";
import type { Attribution } from "@/lib/analytics/attribution";
import { AttributionSchema } from "./attributionSchema";

export type AuthProviderType = "credentials" | "google" | "whatsapp";
export type EmploymentType = EmploymentTypeValue;
export type SalaryRangeType = IncomeRangeValue;

export interface User extends Document {
  email?: string;
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
  /** Where the user came from when they signed up (UTMs/fbclid); set once. */
  signupAttribution?: Attribution;
}

const UserSchema: Schema<User> = new Schema({
  // Optional: login is by WhatsApp number. Users can add an email from their
  // profile. Sparse so the many email-less users don't collide on null.
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
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
    enum: ["credentials", "google", "whatsapp"],
    default: ["whatsapp"],
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
  // The login identity. Unique among verified numbers (see index below);
  // unverified numbers are leftovers from the old profile form and may repeat.
  phoneNumber: {
    type: String,
    required: false,
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
  signupAttribution: {
    type: AttributionSchema,
    required: false,
  },
});

UserSchema.index(
  { phoneNumber: 1 },
  { unique: true, partialFilterExpression: { isPhoneVerified: true } },
);

const UserModal =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default UserModal;
