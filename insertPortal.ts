import { AllPortals } from "./src/lib/data/portals";
import dbConnect from "./src/lib/utils/dbConnet";
import Portal from "./src/models/Portal";
import mongoose from "mongoose";

async function insertPortals() {
  try {
    await dbConnect();

    console.log("Connected to MongoDB");

    const result = await Portal.insertMany(AllPortals, { ordered: false });
    console.log(`Inserted ${result.length} portals successfully!`);
  } catch (err: any) {
    if (err.code === 11000) {
      console.log("Duplicate portals were skipped.");
    } else {
      console.error("Error inserting portals:", err);
    }
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

insertPortals();
