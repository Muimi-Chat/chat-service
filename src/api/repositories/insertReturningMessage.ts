import { db } from "src/db";
import { conversation, message } from "src/schema";

export default async function insertReturningMessage(
    conversationID: number,
    content: string,
    tokenCost: number,
    sender: 'SYSTEM' | 'BOT' | 'USER',
    botModel: string | null = null
) {
    return await db.insert(message).values({
        conversationID: conversationID,
        encryptedContent: content,
        tokenCost: tokenCost,
        sender: sender,
        botModel: botModel
    }).returning();
}