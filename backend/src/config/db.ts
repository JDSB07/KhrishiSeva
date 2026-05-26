import mongoose from "mongoose";
import { seedMockDatabase } from "../utils/mockDb";

const connectDB = async (): Promise<void> => {
  try {
    const connUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/krishiseva";
    
    mongoose.set("strictQuery", true);
    
    // Set 2-second timeout for quick fallback
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.warn("\n⚠️  LOCAL MONGODB SERVICE NOT DETECTED.");
    console.warn("🚀 SWITCHING TO IN-MEMORY RESILIENT DATABASE FOR TESTING & DEMONSTRATION! 🚀\n");
    process.env.USE_MOCK_DB = "true";
    seedMockDatabase();
  }
};

export default connectDB;
