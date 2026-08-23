const HEARTBEAT_INTERVAL_MS = 15000;
const HEARTBEAT_TTL_SECONDS = 45;

const startHeartbeat = (kb, serviceName) => {
  const publish = async () => {
    const now = Date.now();

    try {
      await kb.redisClient.set(`kb:heartbeat:${serviceName}`, now, HEARTBEAT_TTL_SECONDS);
      await kb.redisClient
        .multi()
        .set(`kb:heartbeat:${serviceName}:lastSeen`, JSON.stringify(now))
        .exec();
    } catch (error) {
      console.error(`[Heartbeat] Failed to publish heartbeat for ${serviceName}:`, error);
    }
  };

  publish();
  return setInterval(publish, HEARTBEAT_INTERVAL_MS);
};

module.exports = { startHeartbeat, HEARTBEAT_INTERVAL_MS, HEARTBEAT_TTL_SECONDS };
