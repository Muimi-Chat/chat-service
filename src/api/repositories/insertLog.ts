import { db } from "src/db";
import { log } from "src/schema";

export default async function insertLog(
    message: string, 
    severity: "INFO" | "DEBUG" | "VERBOSE" | "WARNING" | "ERROR" | "CRITICAL" = "INFO") {
    return await db.insert(log).values({
        content: message,
        severity: severity
    })
}