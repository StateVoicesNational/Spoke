import gql from "graphql-tag";

export const schema = gql`
  enum MessageServiceType {
    SMS
  }

  type MessageService {
    name: String!
    type: MessageServiceType!
    config: JSON
    supportsOrgConfig: Boolean!
    supportsCampaignConfig: Boolean!
  }
`;
