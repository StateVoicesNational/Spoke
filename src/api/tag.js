import { gql } from "@apollo/client";

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
    campaignContactId: String
    id: ID
    value: String
  }
`;
