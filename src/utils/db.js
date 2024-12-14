import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({
  path: "../../.env",
});

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("Connecting to MongoDB URI:", MONGODB_URI); // Debugging log
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Adjust timeout for connection selection
      socketTimeoutMS: 10000, // Adjust socket timeout
    }).then((mongoose) => {
      console.log("Connected to MongoDB");
      return mongoose;
    }).catch((err) => {
      console.error("MongoDB connection error:", err);
      throw err;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
