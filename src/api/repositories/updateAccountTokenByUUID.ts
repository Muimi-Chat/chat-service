import { db } from "src/db";
import { account } from "src/schema";
import insertLog from "./insertLog";
import { eq } from "drizzle-orm";

export default async function updateAccountTokenByUUID(
    uuid: string,
    token: number
) {
    try {
        return await db.update(account).set({token: token}).where(eq(account.id, uuid)).returning()
    } catch (err) {
        const message = `Failed to update account tokens (${token}) with UUID (${uuid}) :: ${err}`
        console.error(message)
        await insertLog(message, "ERROR")
        throw err
    }
}