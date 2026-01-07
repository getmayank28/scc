import { NextResponse } from "next/server";
import { Waitlist } from "@/models/Waitlist";
import { z } from "zod";
import dbConnect from "@/lib/utils/dbConnet";

const waitlistSchema = z.object({
  email: z.string().email(),
  mobile: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = waitlistSchema.parse(body);

    await dbConnect();

    const existingUser = await Waitlist.findOne({ email: data.email });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already on the waitlist" },
        { status: 409 }
      );
    }

    await Waitlist.create({
      email: data.email,
      mobile: data.mobile,
    });

    return NextResponse.json(
      { message: "Successfully added to waitlist" },
      { status: 201 }
    );
  } catch {
    console.error("Waitlist API error");

    return NextResponse.json(
      { message: "Failed to add in waitlist" },
      { status: 500 }
    );
  }
}
