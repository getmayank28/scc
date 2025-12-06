import { ApiResponse } from "@/lib/utils/ApiResponse";
import dbConnect from "@/lib/utils/dbConnet";
import UserModal from "@/models/User";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, code } = await request.json();
    const decodedUsername = decodeURIComponent(username);

    const user = await UserModal.findOne({ email: decodedUsername });

    if (!user) {
      return ApiResponse.error("User not found", 404);
    }

    const isCodeValid = user.verificationCode === code;
    const iscodeNotExpired = new Date(user.verificationCodeExpiry) > new Date();

    if (isCodeValid && iscodeNotExpired) {
      user.isVerified = true;
      await user.save();
      return ApiResponse.success("Account verified successfully", 200);
    } else if (!iscodeNotExpired) {
      return ApiResponse.error("Verification code has expired", 500);
    } else {
      return ApiResponse.error("Invalid code", 500);
    }
  } catch (err) {
    console.error("Error verifying code", err);
    return ApiResponse.error("Error verifying code", 500);
  }
}
