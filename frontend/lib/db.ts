import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Global caching for Vercel serverless functions to prevent connection exhaustion
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    // Bulletproof Rule #1: Log visible warning, throw standard error, DO NOT crash with process.exit
    console.error("CRITICAL: MONGODB_URI is missing");
    throw new Error("Database configuration error: MONGODB_URI is not defined");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    mongoose.set("strictQuery", true);
    
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log(`MongoDB Connected (Serverless): ${mongoose.connection.host}`);
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  
  return cached.conn;
}

export default connectDB;
