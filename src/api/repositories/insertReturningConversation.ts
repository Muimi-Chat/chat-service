import { db } from "src/db";
import { conversation } from "src/schema";

export default async function insertReturningConversation(userUUID: string, title: string) {
    return await db.insert(conversation).values({
        accountID: userUUID,
        title: title
    }).returning();
}