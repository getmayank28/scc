// scripts/insertAllCards.ts
import { AllCards } from "./src/lib/data/cards";
import dbConnect from "./src/lib/utils/dbConnet";
import CardModel from "./src/models/Card";
import mongoose from "mongoose";

async function insertCards() {
  try {
    await dbConnect();

    console.log("Connected to MongoDB");

    const result = await CardModel.insertMany(AllCards, { ordered: false });
    console.log(`Inserted ${result.length} cards successfully!`);
  } catch (err: any) {
    if (err.code === 11000) {
      console.log("Duplicate cards were skipped.");
    } else {
      console.error("Error inserting cards:", err);
    }
  } finally {
    // 3️⃣ Close connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

insertCards();
