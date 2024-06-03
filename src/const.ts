

const redisPassword = process.env.REDIS_PASSWORD || "REDIS_PASSWORD_NOT_SET"
export const REDIS_CONNECTION_STRING = `redis://:${redisPassword}@chat-cache:6379`

export const USER_SERVICE_API_CONFIG = {
    SSL_ENABLED: (process.env.USER_SERVICE_SSL_ENABLED || 'false') === 'true',
    BASE_DOMAIN: process.env.USER_SERVICE_API_DOMAIN || 'USER_DOMAIN_NOT_SET',
    API_TOKEN: process.env.USER_SERVICE_API_TOKEN || "USER_API_TOKEN_NOT_SET"
}