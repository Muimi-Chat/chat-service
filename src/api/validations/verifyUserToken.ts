import { createClient } from "redis";
import insertLog from "../repositories/insertLog";
import { REDIS_CONNECTION_STRING } from "src/configs/redisConnectionString";
import fetchUserInformation from "../services/fetchUserInformation";

/**
 * Verify a session token by a given user.
 * @param sessionToken 
 * @param username 
 * @param userAgent 
 * @returns The user UUID if valid. Null if not.
 */
export default async function verifyUserToken(sessionToken: string, username: string, userAgent: string) {
    const client = createClient({
        url: REDIS_CONNECTION_STRING
    })
    .on('error', async err => {
        console.log('Connecting Redis Client Error', err);
        await insertLog(`Error connecting to Redis :: ${err}`);
    })

    try {
        await client.connect();
        let userUUID = await client.get(`${username}_${sessionToken}`);
        if (userUUID == null) {
            let userInformation = await fetchUserInformation(sessionToken, userAgent, username)
            if (userInformation.status != "SUCCESS") {
                await insertLog(`Failed to fetch user information (${username}) with status :: ${userInformation.status}`, "WARNING")
                return null
            }

            userUUID = userInformation.uuid;
            await client.set(`${username}_${sessionToken}`, userUUID, {
                EX: 60,
                NX: true
            })
        }
        return userUUID

    } catch (err) {
        console.error('Error in verifyUserToken ::', err);
        await insertLog(`Error in verifyUserToken :: ${err}`, "CRITICAL");
        throw err
    } finally {
        await client.disconnect()
    }
}