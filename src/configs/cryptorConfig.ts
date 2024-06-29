const authApiKey = process.env.CAPPU_CRYPT_API_KEY || "CRYPT API KEY NOT SET"


const cryptHost = process.env.CAPPU_CRYPT_HOST || "CRYPT HOST NOT SET"
const crypyPort = process.env.CAPPU_CRYPT_PORT || "CRYPT PORT NOT SET"
export const CAPPU_AUTH_KEY = authApiKey
export const CAPPU_BASE_HTTP = `http://${cryptHost}:${crypyPort}`