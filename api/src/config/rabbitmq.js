// config/rabbitmq.js
import amqp from "amqplib";

let connection = null;
let channel = null;

const QUEUE_NAME = "pinecone_sync";
const DLX_NAME = "pinecone_sync_dlx";
const DLQ_NAME = "pinecone_sync_failed";
const DLQ_ROUTING_KEY = "failed";

// ─────────────────────────────────────────────────────────────
// initRabbitMQ — gọi 1 lần lúc app khởi động (trước app.listen())
// ─────────────────────────────────────────────────────────────
export async function initRabbitMQ() {
  if (channel) return channel; // tránh init lại nhiều lần

  if (!process.env.RABBITMQ_URL) {
    throw new Error("Thiếu RABBITMQ_URL trong .env");
  }

  connection = await amqp.connect(process.env.RABBITMQ_URL);

  connection.on("error", (err) => {
    console.error("❌ [RabbitMQ] Connection error:", err.message);
  });

  connection.on("close", () => {
    console.warn("⚠️ [RabbitMQ] Connection closed. Đang thử kết nối lại sau 5s...");
    channel = null;
    connection = null;
    setTimeout(initRabbitMQ, 5000);
  });

  channel = await connection.createChannel();

  // Dead letter exchange + queue — chứa job lỗi sau khi retry hết / nack
  await channel.assertExchange(DLX_NAME, "direct", { durable: true });
  await channel.assertQueue(DLQ_NAME, { durable: true });
  await channel.bindQueue(DLQ_NAME, DLX_NAME, DLQ_ROUTING_KEY);

  // Queue chính — job sync Pinecone
  await channel.assertQueue(QUEUE_NAME, {
    durable: true, // sống sót qua restart RabbitMQ
    arguments: {
      "x-dead-letter-exchange": DLX_NAME,
      "x-dead-letter-routing-key": DLQ_ROUTING_KEY,
    },
  });

  console.log("✅ [RabbitMQ] Connected & queues ready");
  return channel;
}

// ─────────────────────────────────────────────────────────────
// getChannel — dùng ở bất kỳ đâu cần publish/consume sau khi đã init
// ─────────────────────────────────────────────────────────────
export function getChannel() {
  if (!channel) {
    throw new Error("[RabbitMQ] Channel chưa được khởi tạo — gọi initRabbitMQ() trước.");
  }
  return channel;
}

// ─────────────────────────────────────────────────────────────
// pushSyncJob — publish job vào queue chính
// Dùng trong controller update/delete barber, service, branch
// ─────────────────────────────────────────────────────────────
export function pushSyncJob({ id, table, action = "upsert" }) {
  const ch = getChannel();
  const payload = { id, table, action };

  const sent = ch.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(payload)), {
    persistent: true, // message không mất khi RabbitMQ restart
  });

  if (!sent) {
    console.warn(`⚠️ [RabbitMQ] Queue đầy hoặc lỗi buffer, job có thể bị delay: ${JSON.stringify(payload)}`);
  }

  console.log(`📤 [RabbitMQ] Đã đẩy job: ${JSON.stringify(payload)}`);
  return sent;
}

export { QUEUE_NAME, DLQ_NAME };