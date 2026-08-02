// @ts-ignore
import { createClient } from "redis"
import "dotenv/config"

const redisClient = createClient({
    url: process.env.REDIS_URL,
})

redisClient.on("error", (err: Error) => console.error("Redis Client Error", err));

// connect() is intentionally not awaited here — module load must not block app
// startup. Callers that need a live connection must check isRedisReady() first;
// a client that never connected stays not-ready rather than throwing at import.
redisClient.connect().catch((err: Error) => {
    console.error("Redis initial connect failed", err);
});

export function isRedisReady(): boolean {
    return redisClient.isReady;
}

export default redisClient;
