import mongoose, { Document, Schema } from "mongoose";

export type AuthProviderType = "credentials" | "google";
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
});

const UserModal =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default UserModal;
