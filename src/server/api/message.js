import { mapFieldsToModel } from "./lib/utils";
import { Message } from "../models";

export const resolvers = {
  Message: {
    ...mapFieldsToModel(
      ["text", "userNumber", "contactNumber", "createdAt", "isFromContact"],
      Message
    ),
    media: msg =>
      // Sometimes it's array, sometimes string. Maybe db vs. cache?
      typeof msg.media === "string" ? JSON.parse(msg.media) : msg.media || [],
    // cached messages don't have message.id -- why bother
    id: msg => msg.id || `fake${Math.random()}`,
    userId: msg => msg.user_id || null
  }
};
