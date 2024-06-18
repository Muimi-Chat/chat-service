import { desc, eq, and } from "drizzle-orm";
import { db } from "src/db";
import { account, conversation } from "src/schema";
import insertLog from "./insertLog";

export default async function selectConversationsByUserID(userID: string, selectDeleted = false, selectArchived = true) {
  try {
    return await db.select()
    .from(conversation)
    .where(and(
            eq(conversation.accountID, userID),
            eq(conversation.deleted, selectDeleted),
            eq(conversation.archived, selectArchived)
        )  
    )
    .orderBy(desc(conversation.creationDate));
  } catch (err) {
    const message = `Failed to select conversation by User ID (${userID}) :: ${err}`;
    console.error(message);
    await insertLog(message, "ERROR");
    throw err;
  }
}
