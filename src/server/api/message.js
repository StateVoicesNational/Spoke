import { mapFieldsToModel } from "./lib/utils";
import { Message } from "../models";

export const resolvers = {
  Message: {
    ...mapFieldsToModel(
      ["text", "userNumber", "contactNumber", "createdAt", "isFromContact"],
      Message
    ),
    // cached messages don't have message.id -- why bother
    id: msg => msg.id || `fake${Math.random()}`
  }
};
