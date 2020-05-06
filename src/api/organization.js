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
    availableActions: [Action]
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
  }
`;
