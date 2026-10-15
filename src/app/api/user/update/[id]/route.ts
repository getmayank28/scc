import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import User from "@/models/User";
import dbConnect from "@/lib/utils/dbConnet";
import {
  emailSchema,
  nameSchema,
  EMPLOYMENT_TYPE_VALUES,
  INCOME_RANGE_VALUES,
} from "@/schemas/userInfoSchema";

// Empty strings from cleared form fields mean "not provided". The outer
// .optional() is needed: zod 4 treats a preprocessed key as required.
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .preprocess((v) => (v === "" || v === null ? undefined : v), schema.optional())
    .optional();

const updateUserSchema = z
  .object({
    name: optional(nameSchema),
    email: optional(emailSchema),
    employmentType: optional(z.enum(EMPLOYMENT_TYPE_VALUES)),
    salaryRange: optional(z.enum(INCOME_RANGE_VALUES)),
  })
  .refine((d) => d.name || d.email || d.employmentType, {
    message: "Nothing to update",
  })
  .refine(
    (d) =>
      !d.employmentType ||
      d.employmentType === "student_unemployed" ||
      !!d.salaryRange,
    { message: "Please select your income range", path: ["salaryRange"] },
  );

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // A user may only edit their own profile.
    const token = await getToken({
      req,
      secret: process.env.NEXT_AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });
    if (!token?._id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (token._id !== id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const parsed = updateUserSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { name, email, employmentType, salaryRange } = parsed.data;

    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {};
    if (name) $set.name = name;
    if (email) $set.email = email;
    if (employmentType) {
      $set.employmentType = employmentType;
      if (employmentType === "student_unemployed") $unset.salaryRange = 1;
      else $set.salaryRange = salaryRange;
    }

    await dbConnect();
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set, ...(Object.keys($unset).length && { $unset }) },
      { new: true, runValidators: true }
    ).select("name email employmentType salaryRange -_id");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: unknown) {
    // Handle duplicate email error
    // @ts-expect-error some
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 409 }
      );
    }

    console.error("[user/update] error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
