// @ts-ignore
import { createClient } from "redis"
import "dotenv/config"

const redisClient = createClient({
    url: process.env.REDIS_URL,
})

redisClient.on("error", (err: Error) => console.error("Redis Client Error", err));

redisClient.connect();

export default redisClient;