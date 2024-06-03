import { selectMessagesByConversationID } from "../repositories/selectMessagesByConversationID";

export default async function createMessageHistoryChain(conversationID: number): Promise<{
    role: "assistant" | "user" | "system",
    content: string
}[]> {
    const messages = await selectMessagesByConversationID(conversationID)

    const messageChain = []
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        
        let author = message.sender!.toLowerCase()
        if (author == "bot") {
            author = "assistant"
        }

        messageChain.push({
            role: author as ("assistant" | "user" | "system"),
            content: message.content
        })
    }

    return messageChain
}