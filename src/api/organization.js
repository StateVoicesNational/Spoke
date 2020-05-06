import gql from "graphql-tag";

// for phone number reservation sytem add "reservedCount: Int!"
export const schema = `
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
    optOuts: [OptOut]
    threeClickEnabled: Boolean
    optOutMessage: String
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
    cacheable: Int
    twilioAccountSid: String
    twilioAuthToken: String
    twilioMessageServiceSid: String
    fullyConfigured: Boolean
    pendingPhoneNumberJobs: [BuyPhoneNumbersJobRequest]
    phoneNumberCounts: [PhoneNumberCounts]
  }
`;
