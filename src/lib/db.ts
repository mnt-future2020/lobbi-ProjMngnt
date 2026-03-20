import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = global as typeof globalThis & {
  mongoose: CachedConnection;
};

let cached: CachedConnection = globalWithMongoose.mongoose || {
  conn: null,
  promise: null,
};

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 10000,
    });
  }

  cached.conn = await cached.promise;
  globalWithMongoose.mongoose = cached;
  return cached.conn;
}
