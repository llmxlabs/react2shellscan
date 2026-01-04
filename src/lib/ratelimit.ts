import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

export const redis = redisUrl && redisToken 
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null

// Create a new ratelimiter, that allows 5 requests per 10 seconds
export const ratelimit = redis 
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    })
  : null
