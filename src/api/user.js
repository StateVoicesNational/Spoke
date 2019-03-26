export const schema = `
  type User {
    id: ID
    firstName: String
    lastName: String
    displayName: String
    email: String
    cell: String
    organizations(role: String): [Organization]
    todos(organizationId: String): [Assignment]
    roles(organizationId: String!): [String]
    assignedCell: Phone
    assignment(campaignId: String): Assignment,
    terms: Boolean
  }
  
type UsersList {
  users: [User]
}

type PaginatedUsers {
  users: [User]
  pageInfo: PageInfo
}

union UsersReturn = PaginatedUsers | UsersList
`
