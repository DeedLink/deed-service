import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import deedRoutes from "./routes/deedRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import { sendToQueue } from "./utils/producer.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/deeds", deedRoutes);

const res = await sendToQueue({ event: "DeedServiceStarted", timestamp: new Date().toISOString() });
console.log("Deed service start event sent to queue:", res);

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Deed service running on port ${PORT}`));
