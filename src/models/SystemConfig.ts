import mongoose, { Schema, Document } from "mongoose";

export interface SystemConfig extends Document {
  questionsVersion: number;
}

const SystemConfigSchema = new Schema<SystemConfig>({
  questionsVersion: {
    type: Number,
  },
});

const SystemConfigModel =
  (mongoose.models.SystemConfig as mongoose.Model<SystemConfig>) ||
  mongoose.model<SystemConfig>("SystemConfig", SystemConfigSchema);

export default SystemConfigModel;
