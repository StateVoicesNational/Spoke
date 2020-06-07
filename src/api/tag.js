import gql from "graphql-tag";

export const schema = gql`
  type Tag {
    id: ID
    name: String
    group: String
    description: String
    isDeleted: Boolean
    organizationId: String
  }

  type ContactTag {
    id: ID
    value: String
  }
`;
