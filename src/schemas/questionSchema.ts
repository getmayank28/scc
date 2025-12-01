import { z } from "zod";

export const InputPropsSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  descripton: z.string().optional(),
  inputType: z.enum(["text", "number", "select", "multiselect"]),
  allowSkip: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
});

export const QuestionSchema = z.object({
  questionId: z.string(),
  question: z.string(),
  descripton: z.string().optional(),
  order: z.number(),
  inputs: z.array(InputPropsSchema), // <-- Updated to match Mongo schema
});

export type Question = z.infer<typeof QuestionSchema>;
