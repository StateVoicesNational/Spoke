import gql from "graphql-tag";

export const schema = gql`
  input CampaignsFilter {
    isArchived: Boolean
    campaignId: Int
    campaignIds: [Int]
    listSize: Int
    pageSize: Int
    searchString: String
  }

  type TexterUIConfig {
    options: String
    sideboxChoices: [String]
  }

  input TexterUIConfigInput {
    options: String
    sideboxChoices: [String]
  }

  type ErrorStat {
    code: String!
    count: Int!
    link: String
    description: String
  }

  type CampaignStats {
    sentMessagesCount: Int
    receivedMessagesCount: Int
    optOutsCount: Int
    errorCounts: [ErrorStat]
  }

  type CampaignCompletionStats {
    assignedCount: Int
    contactsCount: Int
    errorCount: Int
    messagedCount: Int
    needsResponseCount: Int
  }

  type IngestMethod {
    name: String!
    displayName: String
    clientChoiceData: String
    success: Boolean
    result: String
    reference: String
    contactsCount: Int
    deletedOptouts: Int
    deletedDupes: Int
    updatedAt: Date
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
    joinToken: String
    batchSize: Int
    dueBy: Date
    isStarted: Boolean
    isArchived: Boolean
    creator: User
    texters: [User]
    assignments(assignmentsFilter: AssignmentsFilter): [Assignment]
    interactionSteps: [InteractionStep]
    contacts: [CampaignContact]
    contactsCount: Int
    hasUnassignedContacts: Boolean
    hasUnassignedContactsForTexter: Boolean
    hasUnsentInitialMessages: Boolean
    customFields: [String]
    cannedResponses(userId: String): [CannedResponse]
    texterUIConfig: TexterUIConfig
    stats: CampaignStats
    completionStats: CampaignCompletionStats
    pendingJobs: [JobRequest]
    ingestMethodsAvailable: [IngestMethod]
    ingestMethod: IngestMethod
    useDynamicAssignment: Boolean
    introHtml: String
    primaryColor: String
    logoImageUrl: String
    editors: String
    cacheable: Boolean
    overrideOrganizationTextingHours: Boolean
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
    timezone: String
    messageserviceSid: String
    useOwnMessagingService: Boolean
    phoneNumbers: [String]
  }

  type CampaignsList {
    campaigns: [Campaign]
  }

  union CampaignsReturn = PaginatedCampaigns | CampaignsList

  type PaginatedCampaigns {
    campaigns: [Campaign]
    pageInfo: PageInfo
  }
`;
