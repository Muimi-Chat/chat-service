import { eq } from "drizzle-orm";
import { db } from "src/db";
import { account } from "src/schema";
import insertLog from "./insertLog";

export default async function selectAccountByUUID(
    uuid: string
) {
    try {
        return await db.select().from(account).where(eq(account.id, uuid))
    } catch (err) {
        const message = `Failed to select account by UUID (${uuid}) :: ${err}`
        console.error(message)
        await insertLog(message, "ERROR")
        throw err
    }
}