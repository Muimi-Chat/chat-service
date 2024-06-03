import OpenAI from "openai";
import insertLog from "src/api/repositories/insertLog";
import { TITLE_CREATOR_BOT_MODEL } from "src/configs/titleCreatorBotModel";

/**
 * 
 * @param openAiClient OpenAI Client Object
 * @param initialMessage Initial message, to generate the title upon.
 * @param userID UUID of the user, or something unique to identify the user of the initial message.
 * @returns The title of the conversation, limited to 256 characters.
 */
export default async function generateConversationTitle(openAiClient: OpenAI, initialMessage: string, userID: string) {
    const completion = await openAiClient.chat.completions.create({
        messages: [
            { role: "system", content: "You are conversation title generator. You will generate a title for a conversation, based on the users message. The title should not be more than 256 characters." },
            { role: "user", content: initialMessage }
        ],
        model: TITLE_CREATOR_BOT_MODEL,
        user: userID
    });

    await insertLog(`Generated title (${completion.id}) :: ${completion.usage?.total_tokens!} tokens`, "INFO")

    return trimString(completion.choices[0].message.content!, 256)
}