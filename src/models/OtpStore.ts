import mongoose, { Document, Schema } from "mongoose";

export interface IOtpStore extends Document {
  phoneNumber: string; // E.164 format without leading + e.g. "919876543210"
  otp: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const OtpStoreSchema: Schema<IOtpStore> = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // MongoDB TTL index — auto-deletes when expiresAt is past
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const OtpStore =
  (mongoose.models.OtpStore as mongoose.Model<IOtpStore>) ||
  mongoose.model<IOtpStore>("OtpStore", OtpStoreSchema);

export default OtpStore;
