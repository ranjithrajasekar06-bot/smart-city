import mongoose from "mongoose";
import { loadAndSeedStore, enableMongooseMock } from "./mockMongoose";

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;
  let usingFallback = false;

  if (!uri || uri.trim() === "" || uri.includes("...") || uri.includes("your_mongodb_uri") || uri.includes("mongodb+srv://user:password@cluster")) {
    console.warn("MONGODB_URI is missing or contains a placeholder. Loading elegant local sandbox fallback...");
    usingFallback = true;
  }

  if (usingFallback) {
    await loadAndSeedStore();
    enableMongooseMock();
    return true;
  }

  try {
    // Re-enable buffering but with a clear timeout strategy
    mongoose.set("bufferCommands", true); 
    const conn = await mongoose.connect(uri!, {
      serverSelectionTimeoutMS: 5000, // Fail fast if no connection after 5s
      connectTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error instanceof Error ? error.message : String(error)}`);
    console.warn("Cloud MongoDB connection failed! Automatically transitioning to robust local fallback...");
    await loadAndSeedStore();
    enableMongooseMock();
    return true;
  }
};

export default connectDB;
