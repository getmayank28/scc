import { questions } from "@/lib/data/questions";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import dbConnect from "@/lib/utils/dbConnet";
import QuestionSetModel, { QuestionDocument } from "@/models/Question";
import SystemConfigModel from "@/models/SystemConfig";
import { QuestionSchema } from "@/schemas/questionSchema";

export async function GET() {
  await dbConnect();

  try {
    const questions = await QuestionSetModel.find({}).lean().sort({ order: 1 });
    const parsedQuestions = questions[0].questions.map((q) =>
      QuestionSchema.parse(q)
    );

    return ApiResponse.success(
      "Successfully get the questions",
      200,
      parsedQuestions
    );
  } catch (err) {
    console.error("Error getting questions", err);
    return ApiResponse.error("Error getting questions", 500);
  }
}

export async function POST() {
  await dbConnect();

  try {
    const config = await SystemConfigModel.findOne();
    if (!config?.questionsVersion) {
      await QuestionSetModel.create(questions as QuestionDocument);

      await SystemConfigModel.create({ questionsVersion: questions.version });

      return ApiResponse.success(
        "Questions added successfully with version: " + questions.version,
        201
      );
    } else {
      if (config.questionsVersion < questions.version) {
        await QuestionSetModel.findOneAndUpdate({}, questions, {
          upsert: true,
          overwrite: true,
        });
        config.questionsVersion = questions.version;
        await config.save();
        console.log("Added questions version", questions.version);
        return ApiResponse.success(
          "Questions added successfully with version: " + questions.version,
          201
        );
      }
    }
  } catch (err) {
    console.error("Error submitting questions", err);
    return ApiResponse.error("Error submitting questions", 500);
  }
}
