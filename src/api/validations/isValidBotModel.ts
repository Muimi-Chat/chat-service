import { USABLE_BOT_MODELS } from "src/configs/usableBotModels";

export default function isValidBotModel(botModel: string) {
    return USABLE_BOT_MODELS.includes(botModel)
}