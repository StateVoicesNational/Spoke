import gql from "graphql-tag";

export const schema = gql`
  type MessageService {
    name: String!
    config: JSON
    supportsOrgConfig: Boolean!
  }
`;
