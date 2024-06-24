import { RawData, WebSocket } from 'ws';
import insertLog from '../repositories/insertLog';

/**
 * Represents a message's attachment.
 * 
 * Data should be a base64 blob binary.
 */
interface MessageAttachment {
    filename: string,
    data: string
}

import OpenAI from "openai";
import CreateOpenAiClient from '../helpers/createOpenAiClient';
import verifyUserToken from '../validations/verifyUserToken';
import isValidBotModel from '../validations/isValidBotModel';
import isEmptyOrWhitespace from '../validations/isEmptyOrWhitespace';
import { CHAT_INPUT_LIMITATION } from 'src/configs/chatInputLimitation';
import generateConversationTitle from '../services/openAI/generateConversationTitle';
import insertReturningConversation from '../repositories/insertReturningConversation';
import selectConversationByID from '../repositories/selectConversationByID';
import createMessageHistoryChain from '../helpers/createMessageHistoryChain';
import chatStream from '../services/openAI/chatStream';
import insertReturningMessage from '../repositories/insertReturningMessage';
import selectAccountByUUID from '../repositories/selectAccountByUUID';
import { db } from 'src/db';
import updateAccountTokenByUUID from '../repositories/updateAccountTokenByUUID';

function getSenderUserUUID(data: any): Promise<string | null> {
    const sessionToken: string = data.session_token
    const username: string = data.username
    const userAgent: string = data.user_agent

    return verifyUserToken(sessionToken, username, userAgent)
}

// TODO: Support custom system messages...
export default async function chatMessageConsumer(socketClient: WebSocket, content: RawData) {
    try {
        const data = JSON.parse(content.toString())

        const userUUID = await getSenderUserUUID(data)
        if (userUUID == null) {
            console.warn(`User (${data.username}) tried to send message but session token was bad.`)
            socketClient.send(JSON.stringify({ status: "BAD_SESSION", message: "Bad session token, user should login again!" }));
            return
        }
        const matchingAccounts = await selectAccountByUUID(userUUID)
        if (matchingAccounts.length <= 0) {
            const warningMessage = `Client tried to login as ${data.username} (${userUUID}). But failed to match UUID in database.`
            console.warn(warningMessage)
            await insertLog(warningMessage, "WARNING")
            socketClient.send(JSON.stringify({ status: "BAD_SESSION", message: "Bad session token, user should login again!" }));
            return
        }

        const userAccountModel = matchingAccounts[0]
        if (userAccountModel.token <= 0 && !userAccountModel.freeTokenUsage) {
            socketClient.send(JSON.stringify({ status: "INSUFFICENT_TOKEN", message: "User have no tokens left for chatting!" }));
            return
        }

        const chatModel: string = data.chat_model
        if (!isValidBotModel(chatModel)) {
            const logMessage = `User (${data.username}) tried to use an invalid bad model of ${chatModel}`
            console.log(logMessage)
            await insertLog(logMessage, "INFO")
            socketClient.send(JSON.stringify({ status: "BAD_CHAT_MODEL", message: "Invalid chat model!" }));
            return
        }

        const message: string = data.message
        if (isEmptyOrWhitespace(message)) {
            socketClient.send(JSON.stringify({ status: "EMPTY_MESSAGE", message: "Message should not be empty or whitespace!" }));
            return
        } else if (message.length > CHAT_INPUT_LIMITATION.MAX_MESSAGE_LENGTH) {
            socketClient.send(JSON.stringify({ status: "MESSAGE_LENGTH", message: "Message is too long!" }));
            return
        }

        const conversationID: number | null = data.conversation_id
        const attachments: MessageAttachment[] = data.attachments

        // TODO: Handle attachment size/input validation.

        const openAiClient = CreateOpenAiClient()
        if (openAiClient === null) {
            console.error("An incoming message on websocket consumer was ignored due to unset OpenAI keys!")
            return
        }

        // Create conversation if new conversation,
        // otherwise, try to fetch from database.
        let conversationObject;
        if (conversationID == null) {
            const conversationTitle = await generateConversationTitle(openAiClient, message, userUUID)
            conversationObject = (await insertReturningConversation(userUUID, conversationTitle))[0]

            socketClient.send(JSON.stringify({ 
                status: "NEW_CONVERSATION",
                message: `Created a new conversation`,
                conversation_id: conversationObject.id,
                conversation_title: conversationObject.title
            }));
        } else {
            const results = await selectConversationByID(conversationID)
            if (results.length <= 0) {
                socketClient.send(JSON.stringify({ status: "UNKNOWN_CONVERSATION_ID", message: "Couldn't find a conversation by ID!" }));
                return
            }

            conversationObject = results[0]
        }

        if (conversationObject.deleted) {
            await insertLog(`User (${userUUID}) tried to chat with deleted conversation of ID ${conversationObject.id}`, "WARNING")
            socketClient.send(JSON.stringify({ status: "UNKNOWN_CONVERSATION_ID", message: "Couldn't find a conversation by ID!" }));
            return
        }

        if (conversationObject.archived) {
            await insertLog(`User (${userUUID}) tried to chat with archived conversation of ID ${conversationObject.id}`, "VERBOSE")
            socketClient.send(JSON.stringify({ status: "CONVERSATION_ARCHIVED", message: "Conversation is archived! Unable to chat with an archived conversation..." }));
            return
        }

        // Form a message chain, to let the AI know histories + current message.
        // TODO: Handle attachments, images, document (RAG)

        const messageChain = await createMessageHistoryChain(conversationObject.id)
        messageChain.push({
            role: "user",
            content: message
        })

        socketClient.send(JSON.stringify({ 
            status: "CHUNK_START",
            message: "API is streaming in message, client should be ready."
        }));

        let botReply = ""
        let promptTokenCost = 0
        let completionTokenCost = 0

        // Start streaming in the message chunk by chunk
        const botReplyStream = await chatStream(openAiClient, messageChain, chatModel, userUUID)
        for await (const chunk of botReplyStream) {
            if (chunk.usage != null) {
                promptTokenCost = chunk.usage!.prompt_tokens
                completionTokenCost = chunk.usage!.completion_tokens
                // Because a chunk with usage has no message...
                continue; 
            }

            if (chunk.choices[0].finish_reason != "stop") {
                const chunkContent = chunk.choices[0].delta.content
                botReply += chunkContent
                socketClient.send(JSON.stringify({ 
                    status: "CHUNK",
                    message: "This is a chunk of the bot's message...",
                    chunk_content: chunkContent
                }));
            }
        }

        let userMessageObject;
        let botMessageObject
        await db.transaction(async () => {
            if (!userAccountModel.freeTokenUsage) {
                await updateAccountTokenByUUID(userUUID, userAccountModel.token - promptTokenCost - completionTokenCost)
            }
            userMessageObject = (await insertReturningMessage(conversationObject.id, message, promptTokenCost, "USER"))[0]
            botMessageObject = (await insertReturningMessage(conversationObject.id, botReply, completionTokenCost, "BOT", chatModel))[0]
        })

        socketClient.send(JSON.stringify({ 
            status: "CHUNK_END",
            message: "Chunk has ended.",
            reply_content: botReply,
            user_message_data: {
                id: userMessageObject!.id,
                token_cost: promptTokenCost
            },
            bot_message_data: {
                id: botMessageObject!.id,
                token_cost: completionTokenCost
            }
        }));
    } catch (err) {
        const logMessage = `Failed to handle chat message consumer :: ${err}`
        console.error(logMessage)
        await insertLog(logMessage,  "CRITICAL")
    }
}