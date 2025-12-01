import { ApiResponse } from "@/lib/utils/ApiResponse";
import dbConnect from "@/lib/utils/dbConnet";
import UserModal from "@/models/User";
import { usernameValidations } from "@/schemas/signUpSchema";
import z from "zod";

const UsernameQuerySchema = z.object({
  username: usernameValidations,
});

export async function GET(request: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      username: searchParams.get("username"),
    };
    const result = UsernameQuerySchema.safeParse(queryParams);

    if (!result.success) {
      const usernameErrors = result.error.format().username?._errors || [];
      return ApiResponse.error(
        usernameErrors?.length > 0
          ? usernameErrors.join(" ")
          : "Invalid query parameter",
        400
      );
    }

    const { username } = result.data;

    const existingVerifiedUser = await UserModal.findOne({
      username,
      isVerified: true,
    });

    if (existingVerifiedUser) {
      return ApiResponse.error("Username is already taken", 400);
    }

    return ApiResponse.success("Username is available", 200);
  } catch (err) {
    console.error("Error checking username", err);
    return ApiResponse.error("Error checking username", 500);
  }
}
