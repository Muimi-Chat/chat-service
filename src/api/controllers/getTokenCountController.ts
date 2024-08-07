import { Request, Response } from 'express';
import { createClient } from 'redis';
import insertLog from '../repositories/insertLog';
import fetchUserInformation from '../services/fetchUserInformation';
import selectAccountByUUID from '../repositories/selectAccountByUUID';
import insertAccountWithUUID from '../repositories/insertAccountWithUUID';
import { uuid } from 'drizzle-orm/pg-core';
import { REDIS_CONNECTION_STRING } from 'src/configs/redisConnectionString';
import { db } from 'src/db';
import { configuration } from 'src/schema';

export default async function getTokenCountController(req: Request, res: Response) {
    const client = createClient({
        url: REDIS_CONNECTION_STRING
    });

    console.log("Connecting to Redis");
    client.on('error', async (err: any) => {
        console.log('Connecting Redis Client Error', err);
        await insertLog(`Error connecting to Redis :: ${err}`);
    });

    // Connect to Redis
    client.connect();

    client.on('connect', async () => {
        try {
            const sessionToken: string | undefined = req.headers['session-token'] as string;
            const userAgent: string | undefined = req.headers['user-agent'];
            const username: string | undefined = req.query.username as string;

            if (!sessionToken || !userAgent || !username) {
                return res.status(400).json({
                    status: 'ERROR',
                    message: 'Missing required parameters'
                });
            }
            // See if token exists in cache, if not, re-validate from user service,
            // then flag token as valid for 1 minute.
            let userUUID = await client.get(`${username}_${sessionToken}`);
            if (userUUID == null) {
                console.log("User UUID not found in cache, revalidating from API");
                let userInformation = await fetchUserInformation(sessionToken, userAgent, username)
                if (userInformation.status != "SUCCESS") {
                    console.log(`Failed to fetch user information with status :: ${userInformation.status}`)
                    await insertLog(`Failed to fetch user information with status :: ${userInformation.status}`, "WARNING")
                    return res.status(401).json({
                        status: 'BAD_SESSION',
                        message: 'Session token is bad, relogin!'
                    });
                }

                console.log(`User UUID Revalidated :: ${userInformation.uuid}`);
                userUUID = userInformation.uuid;
                await client.set(`${username}_${sessionToken}`, userUUID, {
                    EX: 60,
                    NX: true
                })
            }

            // Fetch account object from database (create with default if not exists),
            // get the token and free token usage status in account...
            let tokenCount = 25000
            let isFreeTokenUser = false
            const accountObject = await selectAccountByUUID(userUUID)
            if (accountObject.length <= 0) {
                const globalConfig = await db.select().from(configuration);
                const defaultTokenCount = globalConfig[0].defaultUsersTokenCount;
                tokenCount = defaultTokenCount

                await insertAccountWithUUID(userUUID, tokenCount)
                await insertLog(`Created new user in database :: ${uuid}`, "INFO");
            } else {
                tokenCount = accountObject[0].token
                isFreeTokenUser = accountObject[0].freeTokenUsage
            }

            client.quit();

            return res.status(200).json({
                status: 'SUCCESS',
                message: 'Token retrieved successfully',
                token: tokenCount,
                free_token_user: isFreeTokenUser
            });
        } catch (error) {
            console.error('Error in getTokenCountController ::', error);
            await insertLog(`Error in getTokenCountController :: ${error}`, "CRITICAL");

            // Disconnect from Redis
            client.quit();

            return res.status(500).json({
                status: 'ERROR',
                message: 'Internal server error'
            });
        }
    });
}