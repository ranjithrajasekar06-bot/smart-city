import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined in environment variables");
    return false;
  }

  // Check for common placeholders
  if (uri.includes("...") || uri.includes("your_mongodb_uri") || uri.includes("mongodb+srv://user:password@cluster")) {
    console.error("CRITICAL: MONGODB_URI appears to be a placeholder. Please configure a valid MongoDB connection string in the Secrets panel.");
    return false;
  }

  try {
    // Re-enable buffering but with a clear timeout strategy
    mongoose.set("bufferCommands", true); 
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Fail fast if no connection after 5s
      connectTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
};

export default connectDB;
