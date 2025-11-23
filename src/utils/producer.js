import dotenv from "dotenv";
import { getChannel, resetChannel } from "../hopping/rabbitmq.js";

dotenv.config();

const { RABBITMQ_QUEUE } = process.env;

export async function sendToQueue(data) {
  let retries = 3;
  let lastError;

  while (retries > 0) {
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
        return;
      } else {
        throw new Error("Failed to enqueue message - buffer may be full or channel closed");
      }
    } catch (error) {
      lastError = error;
      retries--;
      const attemptNumber = 4 - retries;
      console.error(`Error sending message to RabbitMQ (attempt ${attemptNumber}/3):`, error.message);
      
      if (retries > 0) {
        resetChannel();
        const delay = Math.pow(2, attemptNumber) * 1000;
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  console.error("Failed to send message to RabbitMQ after 3 attempts:", lastError?.message);
  throw lastError || new Error("Failed to send message to RabbitMQ");
}
