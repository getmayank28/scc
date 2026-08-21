import mongoose from "mongoose";

type ConnectionObject = {
  isConnected?: number;
};

const connection: ConnectionObject = {};

// A single in-flight connect shared by all concurrent callers. Without this,
// N simultaneous requests on a cold process each open their own connection.
let connecting: Promise<typeof mongoose> | null = null;

async function dbConnect(): Promise<void> {
  if (connection.isConnected === mongoose.STATES.connected) return;

  // Re-read the live driver state: a dropped connection leaves the memoised
  // flag stale, and reusing it would queue operations against a dead socket.
  if (mongoose.connection.readyState === mongoose.STATES.connected) {
    connection.isConnected = mongoose.connection.readyState;
    return;
  }

  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/test", {})
      .finally(() => {
        connecting = null;
      });
  }

  try {
    const db = await connecting;
    connection.isConnected = db.connections[0].readyState;
  } catch (error) {
    // Never process.exit() here: this runs inside the Next.js server, so
    // exiting would take down every other in-flight request over one failed
    // connection. Throw instead and let the route return a 500.
    connection.isConnected = undefined;
    console.error("DB connection failed", error);
    throw error;
  }
}

export default dbConnect;
