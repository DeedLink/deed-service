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

    await channel.assertQueue(RABBITMQ_QUEUE, { durable: true });

    const payload = Buffer.from(JSON.stringify(data));

    console.log(`Sending message to queue: "${RABBITMQ_QUEUE}"`);
    console.log("Message payload:", JSON.stringify(data, null, 2));

    const success = channel.sendToQueue(RABBITMQ_QUEUE, payload, {
      persistent: true,
      contentType: "application/json",
    });

    if (success) {
      console.log("Message sent to queue successfully:", RABBITMQ_QUEUE);
    } else {
      console.warn("Failed to enqueue message (buffer full or channel closed):", data);
      throw new Error("Failed to send message to queue - buffer may be full or channel closed");
    }
  } catch (error) {
    console.error("Error sending message to RabbitMQ:", error.message);
    console.error("Error stack:", error.stack);
    throw error;
  }
}
