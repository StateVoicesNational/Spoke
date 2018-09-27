export const schema = `
  input PeopleFilter {
    campaignsFilter: CampaignsFilter
  }

  type Organization {
    id: ID
    uuid: String
    name: String
    campaigns(campaignsFilter: CampaignsFilter): [Campaign]
    people(role: String, campaignId: String): [User]
    optOuts: [OptOut]
    threeClickEnabled: Boolean
    optOutMessage: String
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
  }
`
