import mongoose from "mongoose";
import { Gray, Green, LogManager, Yellow } from "src/handler";

async function conncectDatabase(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URI) return false;

    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.DATABASE_URI);
    LogManager.logDefault(`${Yellow('>>')} ${Green('MongoDB')} ${Gray('connected!')}`)
    return true;
  } catch (_error) {
    LogManager.logError('Failed to connect to db')
    return false;
  }
}

export { conncectDatabase };
