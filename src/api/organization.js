import gql from "graphql-tag";

export const schema = gql`
  type ActionChoice {
    name: String!
    details: String!
  }

  type Action {
    name: String
    displayName: String
    instructions: String
    clientChoiceData: [ActionChoice]
  }

  type PhoneNumberCounts {
    areaCode: String!
    availableCount: Int!
    allocatedCount: Int!
  }

  type BuyPhoneNumbersJobRequest {
    id: String!
    assigned: Boolean!
    status: Int
    resultMessage: String
    areaCode: String!
    limit: Int!
  }

  type ProfileField {
    name: String!,
    label: String!
  }

  type Organization {
    id: ID
    uuid: String
    name: String
    campaigns(
      cursor: OffsetLimitCursor
      campaignsFilter: CampaignsFilter
      sortBy: SortCampaignsBy
    ): CampaignsReturn
    people(role: String, campaignId: String, sortBy: SortPeopleBy): [User]
    profileFields: [ProfileField]
    optOuts: [OptOut]
    availableActions: [Action]
    optOutMessage: String
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
    texterUIConfig: TexterUIConfig
    cacheable: Int
    tags(group: String): [Tag]
    twilioAccountSid: String
    twilioAuthToken: String
    twilioMessageServiceSid: String
    fullyConfigured: Boolean
    phoneInventoryEnabled: Boolean
    pendingPhoneNumberJobs: [BuyPhoneNumbersJobRequest]
    phoneNumberCounts: [PhoneNumberCounts]
  }
`;
