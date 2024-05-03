import gql from "graphql-tag";

// TODO: rename phoneNumbers to messagingServiceNumbers or something like that
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

  type CampaignPhoneNumberCount {
    areaCode: String!
    count: Int!
  }

  input CampaignPhoneNumberInput {
    areaCode: String!
    count: Int!
  }

  type CampaignContactsAreaCodeCount {
    areaCode: String!
    state: String!
    count: Int!
  }

  type CampaignExportData {
    error: String
    campaignExportUrl: String
    campaignMessagesExportUrl: String
  }

  type Campaign {
    id: ID
    organization: Organization
    title: String
    description: String
    joinToken: String
    batchSize: Int
    batchPolicies: [String]
    responseWindow: Float
    dueBy: Date
    isStarted: Boolean
    isStarting: Boolean
    isArchived: Boolean
    isArchivedPermanently: Boolean
    creator: User
    texters: [User]
    assignments(assignmentsFilter: AssignmentsFilter): [Assignment]
    interactionSteps: [InteractionStep]
    contacts: [CampaignContact]
    contactsCount: Int
    contactsAreaCodeCounts: [CampaignContactsAreaCodeCount]
    hasUnassignedContacts: Boolean
    hasUnassignedContactsForTexter: Boolean
    hasUnsentInitialMessages: Boolean
    customFields: [String]
    cannedResponses(userId: String): [CannedResponse]
    texterUIConfig: TexterUIConfig
    stats: CampaignStats
    completionStats: CampaignCompletionStats
    pendingJobs: [JobRequest]
    exportResults: CampaignExportData
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
    serviceManagers(fromCampaignStatsPage: Boolean): [ServiceManager]

    messageserviceSid: String
    useOwnMessagingService: Boolean
    messageServiceLink: String
    phoneNumbers: [String]
    inventoryPhoneNumberCounts: [CampaignPhoneNumberCount]
    useDynamicReplies: Boolean
    replyBatchSize: Int
  }

  type CampaignsList {
    campaigns: [Campaign]
  }

  type ScriptUpdateResult {
    campaign: Campaign!
    found: String!
    replaced: String!
    target: String!
  }

  union CampaignsReturn = PaginatedCampaigns | CampaignsList

  type PaginatedCampaigns {
    campaigns: [Campaign]
    pageInfo: PageInfo
  }
`;
