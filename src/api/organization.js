export const schema = `
  type Organization {
    id: ID
    uuid: String
    name: String
    campaigns(cursor:OffsetLimitCursor, campaignsFilter: CampaignsFilter): CampaignsReturn
    people(role: String, campaignId: String): [User]
    optOuts: [OptOut]
    threeClickEnabled: Boolean
    optOutMessage: String
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
  }
`