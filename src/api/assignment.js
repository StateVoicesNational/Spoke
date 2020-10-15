export const schema = `
  input AssignmentsFilter {
    texterId: Int
    stats: Boolean
    sender: Boolean
  }

  type AssignmentFeedbackCounts {
    optOuts: Int
    tags: Int
    responses: Int
    hostile: Int
  }

  type FeedbackCreatedBy {
    id: Int
    name: String
  }

  type AssignmentFeedback {
    message: String!
    issueCounts: AssignmentFeedbackCounts!
    isAcknowledged: Boolean!
    createdBy: FeedbackCreatedBy!
  }

  type Assignment {
    id: ID
    texter: User
    campaign: Campaign
    contacts(contactsFilter: ContactsFilter): [CampaignContact]
    contactsCount(contactsFilter: ContactsFilter, hasAny: Boolean): Int
    hasUnassignedContactsForTexter: Int
    userCannedResponses: [CannedResponse]
    campaignCannedResponses: [CannedResponse]
    maxContacts: Int
    feedback: AssignmentFeedback
  }
`;
