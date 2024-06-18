import { Request, Response } from 'express';
import { createClient } from 'redis';
import insertLog from '../repositories/insertLog';
import fetchUserInformation from '../services/fetchUserInformation';
import selectAccountByUUID from '../repositories/selectAccountByUUID';
import insertAccountWithUUID from '../repositories/insertAccountWithUUID';
import { uuid } from 'drizzle-orm/pg-core';
import { REDIS_CONNECTION_STRING } from 'src/configs/redisConnectionString';
import selectConversationsByUserID from '../repositories/selectConversationsByUserID';
import { selectMessagesByConversationID } from '../repositories/selectMessagesByConversationID';

export default async function getConversations(req: Request, res: Response) {
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

            const conversations = await selectConversationsByUserID(userUUID)

            // Asyncrously fetch lastest message for each conversation
            // to determine the last activity for the conversation.
            const result = []
            const messagesPromises = conversations.map(async (conversation) => {
                const messages = await selectMessagesByConversationID(conversation.id, 1)
                return messages
            })

            const messageArrays = await Promise.all(messagesPromises)
            for (let i = 0; i < conversations.length; i++) {
                const currentMessage = messageArrays[i].length >= 1 ? messageArrays[i][0] : undefined
                result.push({
                    "id": conversations[i].id,
                    "title": conversations[i].title,
                    "archived": conversations[i].archived,
                    "created_at": conversations[i].creationDate,
                    "last_activity": currentMessage?.creationDate || conversations[i].creationDate
                })
            }

            client.quit();

            return res.status(200).json({
                status: 'SUCCESS',
                message: 'Successfully fetched conversation',
                data: result
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