import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import dbConnect from "@/lib/utils/dbConnet";
import UserModal from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { username, email, password } = await request.json();

    const existingUserWithVerifiedUsername = await UserModal.findOne({
      username,
      isVerified: true,
    });

    if (existingUserWithVerifiedUsername) {
      return ApiResponse.error("Username is already taken", 400);
    }

    const existingUserByEmail = await UserModal.findOne({ email });
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 1);
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return ApiResponse.error("Email already registered", 400);
      } else {
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verificationCode = verificationCode;
        existingUserByEmail.verificationCodeExpiry = verificationCodeExpiry;

        await existingUserByEmail.save();
      }
    } else {
      const newUser = new UserModal({
        username,
        email,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpiry,
        isVerified: false,
      });

      await newUser.save();
    }

    const emailResponse = await sendVerificationEmail({
      email,
      verificationCode,
    });

    if (!emailResponse.success) {
      return ApiResponse.error(emailResponse.message, 500);
    }
    return ApiResponse.success(
      "Email sent Successfully, Please verify your email",
      201
    );
  } catch (error) {
    console.error("Error registering user", error);
    return ApiResponse.error("Error registering user", 500);
  }
}
