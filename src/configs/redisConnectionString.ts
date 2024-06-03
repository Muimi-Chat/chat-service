const redisPassword = process.env.REDIS_PASSWORD || "REDIS_PASSWORD_NOT_SET"
export const REDIS_CONNECTION_STRING = `redis://:${redisPassword}@chat-cache:6379`