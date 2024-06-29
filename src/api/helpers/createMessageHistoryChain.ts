import { selectMessagesByConversationID } from "../repositories/selectMessagesByConversationID";
import requestDecrypt from "../services/crypt/requestDecrypt";

/**
 * Create a message history chain from the given conversation ID.
 * (Each of the output message in the chain is decrypted)
 * 
 */
export default async function createDecryptedMessageHistoryChain(userUUID: string, conversationID: number): Promise<{
    role: "assistant" | "user" | "system",
    content: string
}[]> {
    const messages = await selectMessagesByConversationID(conversationID)

    const decryptionPromises = messages.map(async (message) => {
        let author = message.sender!.toLowerCase();
        if (author === "bot") {
            author = "assistant";
        }

        return {
            role: author as ("assistant" | "user" | "system"),
            content: await requestDecrypt(userUUID, message.encryptedContent, userUUID)
        };
    });

    return Promise.all(decryptionPromises);
}