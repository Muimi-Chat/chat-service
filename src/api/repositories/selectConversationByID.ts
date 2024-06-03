import { eq } from "drizzle-orm";
import { db } from "src/db";
import { account, conversation } from "src/schema";
import insertLog from "./insertLog";

export default async function selectConversationByID(
    id: number
) {
    try {
        return await db.select().from(conversation).where(eq(conversation.id, id))
    } catch (err) {
        const message = `Failed to select conversation by ID (${id}) :: ${err}`
        console.error(message)
        await insertLog(message, "ERROR")
        throw err
    }
}