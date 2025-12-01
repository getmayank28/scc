import mongoose, { Document, Schema, Model } from "mongoose";

export interface InputProps {
  id: string;
  label?: string;
  descripton?: string;
  inputType: "text" | "number" | "select" | "multiselect";
  allowSkip?: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
  };
}

export interface SingleQuestion {
  questionId: string;
  question: string;
  descripton: string;
  order: number;
  inputs: InputProps[];
}

// InputProps Schema
const InputPropsSchema = new Schema<InputProps>(
  {
    id: { type: String, required: true },
    label: { type: String },
    descripton: { type: String },
    inputType: {
      type: String,
      enum: ["text", "number", "select", "multiselect"],
      required: true,
    },
    allowSkip: { type: Boolean, default: true },
    options: [{ type: String }],
    validation: {
      min: { type: Number },
      max: { type: Number },
    },
  },
  { _id: false, timestamps: true }
);

// SingleQuestion Schema
const SingleQuestionSchema = new Schema<SingleQuestion>(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    descripton: { type: String },
    order: { type: Number, required: true },
    inputs: { type: [InputPropsSchema], required: true },
  },
  { timestamps: true }
);

// Question Document
export interface QuestionDocument extends Document {
  version: number;
  questions: SingleQuestion[];
}

// QuestionSet Schema
const QuestionSetSchema = new Schema<QuestionDocument>(
  {
    version: { type: Number, required: true },
    questions: { type: [SingleQuestionSchema], required: true },
  },
  { timestamps: true }
);

const QuestionSetModel: Model<QuestionDocument> =
  mongoose.models.QuestionSet ||
  mongoose.model<QuestionDocument>("QuestionSet", QuestionSetSchema);

export default QuestionSetModel;
