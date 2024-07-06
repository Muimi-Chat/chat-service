import { db } from "src/db";
import { account } from "src/schema";
import insertLog from "./insertLog";

export default async function insertAccountWithUUID(
    uuid: string,
    newTokenCount: number
) {
    try {
        return await db.insert(account).values({
            id: uuid,
            token: newTokenCount
        })
    } catch (err) {
        const message = `Failed to insert account with UUID (${uuid}) :: ${err}`
        console.error(message)
        await insertLog(message, "ERROR")
        throw err
    }
}