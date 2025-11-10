import { getChannel } from "../config/rabbitmq.js";
import dotenv from "dotenv";
dotenv.config();

const { RABBITMQ_QUEUE } = process.env;

export async function sendToQueue(data) {
  try {
    const channel = await getChannel();
    const payload = Buffer.from(JSON.stringify(data));

    channel.sendToQueue(RABBITMQ_QUEUE, payload, { persistent: true });
    console.log("Sent to queue:", data);
  } catch (error) {
    console.error("Error sending message to RabbitMQ:", error.message);
  }
}
