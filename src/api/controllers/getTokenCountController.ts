import { Request, Response } from 'express';
import { createClient } from 'redis';
import insertLog from '../repositories/insertLog';
import fetchUserInformation from '../services/fetchUserInformation';
import selectAccountByUUID from '../repositories/selectAccountByUUID';
import insertAccountWithUUID from '../repositories/insertAccountWithUUID';
import { uuid } from 'drizzle-orm/pg-core';
import { REDIS_CONNECTION_STRING } from 'src/configs/redisConnectionString';

export default async function getTokenCountController(req: Request, res: Response) {
    const client = createClient({
        url: REDIS_CONNECTION_STRING
    });

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
                let userInformation = await fetchUserInformation(sessionToken, userAgent, username)
                if (userInformation.status != "SUCCESS") {
                    await insertLog(`Failed to fetch user information with status :: ${userInformation.status}`, "WARNING")
                    return res.status(401).json({
                        status: 'BAD_TOKEN',
                        message: 'Session token is bad, relogin!'
                    });
                }

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
                await insertAccountWithUUID(userUUID)
                await insertLog(`Created new user in database :: ${uuid}`, "INFO");
                const defaultTokenCount = parseInt(process.env.DEFAULT_STARTING_TOKEN || "25000") ?? 25000;
                tokenCount = defaultTokenCount
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