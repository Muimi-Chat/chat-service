import OpenAI from "openai"
import insertLog from "../repositories/insertLog"

/**
 * 
 * @returns Null if failed to create (due to lack of enviornment variable set). OpenAI object otherwise.
 */
export default function CreateOpenAiClient() {
    const apiKey = process.env.OPENAI_API_KEY
    const projectID = process.env.OPENAI_PROJECT_ID
    const organizationID = process.env.OPENAI_ORGANIZATION_ID

    if (apiKey == undefined) {
        insertLog("OPENAI_API_KEY enviornment variable is not set", "WARNING")
        return null
    }

    if (projectID == undefined) {
        insertLog("OPENAI_PROJECT_ID enviornment variable is not set", "WARNING")
        return null
    }

    if (organizationID == undefined) {
        insertLog("OPENAI_ORGANIZATION_ID enviornment variable is not set", "WARNING")
        return null
    }

    return new OpenAI({
        organization: organizationID,
        project: projectID,
        apiKey: apiKey
    })
}