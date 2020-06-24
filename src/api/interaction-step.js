export const schema = `
  type InteractionStep {
    id: ID!
    question: Question
    questionText: String
    script: String
    answerOption: String
    parentInteractionId: String
    isDeleted: Boolean
    answerActions: String
    answerActionsData: String
    questionResponse(campaignContactId: String): QuestionResponse
  }
`;
