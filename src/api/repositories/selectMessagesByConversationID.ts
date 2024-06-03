import { desc, eq } from "drizzle-orm";
import { db } from "src/db";
import { message } from "src/schema";
import insertLog from "./insertLog";

/**
 * 
 * @param conversationId The ID of the conversation, sorted by latest messages showing first.
 * @param limit Number of messages to show at once.
 * @param offset Offset from the limit tail. (Useful for pagination)
 * @returns The list of Message Object. (Drizzle ORM)
 */
export async function selectMessagesByConversationID(conversationId: number, limit: number = 5, offset: number = 0) {
    try {
        // Fetch the latest messages for the given conversation ID and limit the selection
        return await db
            .select()
            .from(message)
            .where(eq(message.conversationID, conversationId))
            .orderBy(desc(message.creationDate))
            .limit(limit)
            .offset(offset)
    } catch (error) {
        const errorMessage = `Failed to fetch messages for conversation ID ${conversationId} :: ${error}`
        console.error(errorMessage);
        await insertLog(errorMessage)
        throw error;
    }
}