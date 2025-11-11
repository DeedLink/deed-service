import dotenv from "dotenv";
import { getChannel } from "../hopping/rabbitmq.js";

dotenv.config();

const { RABBITMQ_QUEUE } = process.env;

export async function sendToQueue(data) {
  try {
    const channel = await getChannel();
    if (!channel) {
      throw new Error("No RabbitMQ channel available");
    }

    const payload = Buffer.from(JSON.stringify(data));

    const success = channel.sendToQueue(RABBITMQ_QUEUE, payload, {
      persistent: true,
      contentType: "application/json",
    });

    if (success) {
      console.log("📨 Message sent to queue:", RABBITMQ_QUEUE);
    } else {
      console.warn("Failed to enqueue message (buffer full):", data);
    }
  } catch (error) {
    console.error("Error sending message to RabbitMQ:", error.message);
  }
}
