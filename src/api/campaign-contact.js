export const schema = `
  input ContactsFilter {
    messageStatus: String
    isOptedOut: Boolean
    validTimezone: Boolean
    includePastDue: Boolean
    tags: [String]
    suppressedTags: [String]
    contactId: String
    errorCode: [Int]
  }

  type Timezone {
    offset: Int
    hasDST: Boolean
  }

  type Location {
    timezone: Timezone
    city: String
    state: String
  }

  type CampaignContact {
    id: ID
    firstName: String
    lastName: String
    cell: Phone
    zip: String
    external_id: String
    customFields: JSON
    messages: [Message]
    tags(tagId: String): [ContactTag]
    location: Location
    optOut: OptOut
    campaign: Campaign
    questionResponseValues: [AnswerOption]
    interactionSteps: [InteractionStep]
    messageStatus: String
    assignmentId: String
    errorCode: Int
  }
`;
