import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");

    const db = mongoose.connection;
    const deedsCollection = db.collection("deeds");

    return deedsCollection;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
