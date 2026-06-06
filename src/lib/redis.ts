import { Redis } from "@upstash/redis"

function createRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token || url === "https://seu-url.upstash.io") {
    return null
  }

  return new Redis({ url, token })
}

export const redis = createRedisClient()

export function getRedis() {
  if (!redis) {
    throw new Error(
      "Redis não configurado. Defina UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN no .env.local"
    )
  }
  return redis
}
