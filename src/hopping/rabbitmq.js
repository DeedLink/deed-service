import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const {
  RABBITMQ_USER,
  RABBITMQ_PASS,
  RABBITMQ_HOST,
  RABBITMQ_PORT,
  RABBITMQ_QUEUE,
} = process.env;

const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`;

let channel;

export function resetChannel() {
  if (channel) {
    try {
      channel.close().catch(() => {});
    } catch (e) {
      // Ignore
    }
  }
  channel = null;
}

export async function getChannel() {
  if (channel) {
    return channel;
  }

  try {
    console.log(`Attempting to connect to RabbitMQ at ${RABBITMQ_HOST}:${RABBITMQ_PORT}...`);
    const connection = await amqp.connect(RABBITMQ_URL, {
      heartbeat: 60,
      connection_timeout: 10000,
    });

    connection.on("close", async () => {
      console.warn("RabbitMQ connection closed, reconnecting...");
      channel = null;
      setTimeout(() => {
        getChannel().catch(err => console.error("Reconnection attempt failed:", err.message));
      }, 5000);
    });

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err.message);
      channel = null;
    });

    channel = await connection.createChannel();
    await channel.assertQueue(RABBITMQ_QUEUE, { durable: true });

    console.log("RabbitMQ connected and queue asserted:", RABBITMQ_QUEUE);
    return channel;
  } catch (err) {
    console.error("Failed to connect to RabbitMQ:", err.message);
    console.error("Connection URL:", RABBITMQ_URL.replace(/:[^:@]+@/, ':****@'));
    channel = null;
    throw new Error(`RabbitMQ connection failed: ${err.message}`);
  }
}
