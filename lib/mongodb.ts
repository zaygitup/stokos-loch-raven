import mongoose from "mongoose";

type CachedMongoose = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: CachedMongoose | undefined;
}

const cached: CachedMongoose = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export default async function connectMongoDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is missing. Add it in Vercel Project Settings > Environment Variables."
    );
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", true);

    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "stokos",
      bufferCommands: false,
      maxPoolSize: 20,
      minPoolSize: 1,
      maxIdleTimeMS: 30_000,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}
