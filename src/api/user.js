export const schema = `
  type User {
    id: ID
    firstName: String
    lastName: String
    alias: String
    displayName: String
    email: String
    cell: String
    extra: String
    organizations(role: String): [Organization]
    todos(organizationId: String): [Assignment]
    roles(organizationId: String!): [String]
    assignedCell: Phone
    assignment(campaignId: String): Assignment
    terms: Boolean
    profileComplete(organizationId: String): Boolean
    cacheable: Boolean
  }

type UsersList {
  users: [User]
}

type PaginatedUsers {
  users: [User]
  pageInfo: PageInfo
}

union UsersReturn = PaginatedUsers | UsersList
`;
