export const schema = `
  input PeopleFilter {
    campaignsFilter: CampaignsFilter
  }

  type AssignmentMessage {
    subject: String
    body: String
  }

  type Organization {
    id: ID
    uuid: String
    name: String
    campaigns(campaignsFilter: CampaignsFilter): [Campaign]
    people(role: String): [User]
    optOuts: [OptOut]
    threeClickEnabled: Boolean
    optOutMessage: String
    assignmentMessage: AssignmentMessage
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
  }
`
