import mongoose, { Document, Schema } from "mongoose";

// One row per OTP send, keyed by "phone:<number>" or "ip:<address>". Counted
// to rate-limit sends (each WhatsApp OTP costs money and is a pumping target);
// the TTL index drops rows once they fall out of the longest window.
export interface IOtpSendLog extends Document {
  key: string;
  createdAt: Date;
}

const OtpSendLogSchema: Schema<IOtpSendLog> = new Schema({
  key: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expireAfterSeconds: 60 * 60 },
  },
});

const OtpSendLog =
  (mongoose.models.OtpSendLog as mongoose.Model<IOtpSendLog>) ||
  mongoose.model<IOtpSendLog>("OtpSendLog", OtpSendLogSchema);

export default OtpSendLog;
