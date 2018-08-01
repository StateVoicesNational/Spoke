export const schema = `
  type Question {
    text: String
    answerOptions: [AnswerOption]
    interactionStep: InteractionStep
  }

  type AnswerOption {
    interactionStepId: Int
    value: String
    action: String
    nextInteractionStep: InteractionStep
    responders: [CampaignContact]
    responderCount: Int
    question: Question
  }
`

