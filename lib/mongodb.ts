import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache;
  // eslint-disable-next-line no-var
  var _mongoMemoryUri: string | undefined;
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };
if (!global._mongoose) global._mongoose = cached;

function isLocalUri(uri: string) {
  return uri.includes("localhost") || uri.includes("127.0.0.1");
}

async function resolveUri(): Promise<string> {
  const uri = process.env.MONGODB_URI;

  // Production always requires a real URI
  if (process.env.NODE_ENV === "production") {
    if (!uri) throw new Error("MONGODB_URI is required in production");
    return uri;
  }

  // Dev: use the URI if it points to a real (non-local) host
  if (uri && !isLocalUri(uri)) return uri;

  // Dev fallback: spin up an in-memory MongoDB automatically
  if (!global._mongoMemoryUri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const server = await MongoMemoryServer.create();
    global._mongoMemoryUri = server.getUri();
    console.log("🧪 Using in-memory MongoDB (no local MongoDB detected)");
  }

  return global._mongoMemoryUri;
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = await resolveUri();
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
