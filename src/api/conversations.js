export const schema = `
  input ConversationFilter {
    assignmentsFilter: AssignmentsFilter
    campaignsFilter: CampaignsFilter
    contactsFilter: ContactsFilter
  }

  type Conversation {
    texter: User!
    contact: CampaignContact!
    campaign: Campaign!
  }
  
  type PaginatedConversations {
    conversations: [Conversation]!
    pageInfo: PageInfo
  }
`
