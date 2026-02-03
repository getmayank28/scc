import dbConnect from "@/lib/utils/dbConnet";
import FeedbackSchema from "@/models/FeedbackSchema";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/options";

export async function POST(req: Request) {
    try {
        const { feedback } = await req.json();
        const session = await getServerSession(authOptions);

        if (!session || !feedback) {
            return NextResponse.json(
                { error: "userId and feedback are required" },
                { status: 400 }
            );
        }

        await dbConnect();

        const savedFeedback = await FeedbackSchema.create({
            userId: session?.user?._id,
            email:session?.user?.email,
            feedback,
        });

        return NextResponse.json(savedFeedback, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to save feedback" },
            { status: 500 }
        );
    }
}
