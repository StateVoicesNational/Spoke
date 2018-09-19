export const schema = `
  input CampaignsFilter {
    isArchived: Boolean
    campaignId: Int
    listSize: Int
    pageSize: Int
  }

  type CampaignStats {
    sentMessagesCount: Int
    receivedMessagesCount: Int
    optOutsCount: Int
  }

  type JobRequest {
    id: String
    jobType: String
    assigned: Boolean
    status: Int
    resultMessage: String
  }

  type Campaign {
    id: ID
    organization: Organization
    title: String
    description: String
    dueBy: Date
    isStarted: Boolean
    isArchived: Boolean
    texters: [User]
    assignments(assignmentsFilter: AssignmentsFilter): [Assignment]
    interactionSteps: [InteractionStep]
    contacts: [CampaignContact]
    contactsCount: Int
    hasUnassignedContacts: Boolean
    customFields: [String]
    cannedResponses(userId: String): [CannedResponse]
    stats: CampaignStats,
    pendingJobs: [JobRequest]
    datawarehouseAvailable: Boolean
    useDynamicAssignment: Boolean
    introHtml: String
    primaryColor: String
    logoImageUrl: String
    editors: String
    overrideOrganizationTextingHours: Boolean
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
    timezone: String
  }

  type CampaignsList {
    campaigns: [Campaign]
  }

  union CampaignsReturn = PaginatedCampaigns | CampaignsList
  
  type PaginatedCampaigns {
    campaigns: [Campaign]
    pageInfo: PageInfo
  }  
`
