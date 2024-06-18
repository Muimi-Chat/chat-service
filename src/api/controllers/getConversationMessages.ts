import { Request, Response } from "express";
import { createClient } from "redis";
import insertLog from "../repositories/insertLog";
import fetchUserInformation from "../services/fetchUserInformation";
import { REDIS_CONNECTION_STRING } from "src/configs/redisConnectionString";
import { selectMessagesByConversationID } from "../repositories/selectMessagesByConversationID";
import selectConversationByID from "../repositories/selectConversationByID";

export default async function getConversationMessages(req: Request, res: Response) {
  const client = createClient({
    url: REDIS_CONNECTION_STRING,
  });

  client.on("error", async (err: any) => {
    console.log("Connecting Redis Client Error", err);
    await insertLog(`Error connecting to Redis :: ${err}`);
  });

  // Connect to Redis
  client.connect();

  client.on("connect", async () => {
    try {
      const sessionToken: string | undefined = req.headers[
        "session-token"
      ] as string;
      const userAgent: string | undefined = req.headers["user-agent"];
      const username: string | undefined = req.query.username as string;
      const conversationID: number | undefined = parseInt(req.query
        .conversation_id as string) ?? undefined;

      if (!sessionToken || !userAgent || !username || !conversationID) {
        return res.status(400).json({
          status: "ERROR",
          message: "Missing required parameters",
        });
      }

      // See if token exists in cache, if not, re-validate from user service,
      // then flag token as valid for 1 minute.
      let userUUID = await client.get(`${username}_${sessionToken}`);
      if (userUUID == null) {
        let userInformation = await fetchUserInformation(
          sessionToken,
          userAgent,
          username
        );
        if (userInformation.status != "SUCCESS") {
          await insertLog(
            `Failed to fetch user information with status :: ${userInformation.status}`,
            "WARNING"
          );
          return res.status(401).json({
            status: "BAD_TOKEN",
            message: "Session token is bad, relogin!",
          });
        }

        userUUID = userInformation.uuid;
        await client.set(`${username}_${sessionToken}`, userUUID, {
          EX: 60,
          NX: true,
        });
      }

      const matchingConversations = await selectConversationByID(conversationID)

      if (matchingConversations.length <= 0) { 
        return res.status(400).json({
          status: "BAD_CONVERSATION_ID",
          message: "Conversation not found",
        })
      }

      if (matchingConversations[0].accountID !== userUUID) {
        await insertLog(
          `User ${userUUID} attempted to fetch conversation ${conversationID} from account ${matchingConversations[0].accountID}`,
          "WARNING"
        )
        return res.status(400).json({
          status: "BAD_CONVERSATION_ID",
          message: "Conversation not found",
        })
      }

      const targetConversation = matchingConversations[0]
      const messages = await selectMessagesByConversationID(
        targetConversation.id,
        100
      );

      const result = messages.map((message) => ({
        id: message.id,
        content: message.content,
        author: message.sender,
        token_cost: message.tokenCost,
        created_at: message.creationDate,
        bot_model: message.botModel,
      }));

      client.quit();

      return res.status(200).json({
        status: "SUCCESS",
        message: "Successfully fetched messages",
        data: result,
      });
    } catch (error) {
      console.error("Error in getTokenCountController ::", error);
      await insertLog(
        `Error in getTokenCountController :: ${error}`,
        "CRITICAL"
      );

      // Disconnect from Redis
      client.quit();

      return res.status(500).json({
        status: "ERROR",
        message: "Internal server error",
      });
    }
  });
}
