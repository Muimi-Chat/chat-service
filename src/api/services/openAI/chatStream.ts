import OpenAI from "openai";

interface ChatMessageInterface {
    role: "system" | "user" | "assistant",
    content: string
}

/**
 * NOTE: API Calls include token usage. See https://platform.openai.com/docs/api-reference/chat/streaming#chat/streaming-usage
 * 
 * @param openAiClient OpenAI Client Object
 * @param messageChain Message history, with current message. (RAG Context if needed). Input message should be at the tail of the array.
 * @param botModel Model to use
 * @param userID Something unique to identify the chatting user (user UUID)
 * @returns A chat completion stream object.
 */
export default async function chatStream(openAiClient: OpenAI, messageChain: ChatMessageInterface[], botModel: string, userID: string) {
    return await openAiClient.chat.completions.create({
        model: botModel,
        messages: messageChain,
        stream: true,
        user: userID,
        stream_options: {include_usage: true}
    });
}