import { mapFieldsToModel } from "./lib/utils";
import { CannedResponse } from "../models";

export const resolvers = {
  CannedResponse: {
    ...mapFieldsToModel(
      ["id", "title", "text", "answerActions", "answerActionsData"],
      CannedResponse
    ),
    isUserCreated: cannedResponse => cannedResponse.user_id !== "",
    tagIds: cannedResponse => cannedResponse.tagIds || []
  }
};

CannedResponse.ensureIndex("campaign_id");
