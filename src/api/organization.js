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
    state: String!
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
    name: String!
    label: String!
  }

  type DefaultSettings {
    featuresJSON: String
    unsetFeatures: [String]
  }

  input DefaultSettingsInput {
    featuresJSON: String
    unsetFeatures: [String]
  }

  type ExtensionSettings {
    savedMessageHandlers: [String]
    savedActionHandlers: [String]
    savedContactLoaders: [String]
    allowedMessageHandlers: [String]
    allowedActionHandlers: [String]
    allowedContactLoaders: [String]
    handlerDisplayInformation: String
  }
  input ExtensionSettingsInput {
    savedMessageHandlers: [String]
    savedActionHandlers: [String]
    savedContactLoaders: [String]
    allowedMessageHandlers: [String]
    allowedActionHandlers: [String]
    allowedContactLoaders: [String]
    handlerDisplayInformation: String
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
    campaignsCount: Int
    numTextsInLastDay: Int
    people(role: String, campaignId: String, sortBy: SortPeopleBy): [User]
    profileFields: [ProfileField]
    optOuts: [OptOut]
    allowSendAll: Boolean
    theme: JSON
    availableActions: [Action]
    defaultSettings: DefaultSettings
    extensionSettings: ExtensionSettings
    batchPolicies: [String]
    optOutMessage: String
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
    texterUIConfig: TexterUIConfig
    cacheable: Int
    tags(group: String): [Tag]
    serviceVendor: ServiceVendor
    serviceManagers: [ServiceManager]
    fullyConfigured: Boolean
    emailEnabled: Boolean
    phoneInventoryEnabled: Boolean!
    campaignPhoneNumbersEnabled: Boolean!
    pendingPhoneNumberJobs: [BuyPhoneNumbersJobRequest]
    phoneNumberCounts: [PhoneNumberCounts]
  }
`;
