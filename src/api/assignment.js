export const schema = `
  input AssignmentsFilter {
    texterId: Int
    stats: Boolean
  }
  type Assignment {
    id: ID
    texter: User
    campaign: Campaign
    contacts(contactsFilter: ContactsFilter): [CampaignContact]
    contactsCount(contactsFilter: ContactsFilter): Int
    userCannedResponses: [CannedResponse]
    campaignCannedResponses: [CannedResponse]
    maxContacts: Int
  }
`;
