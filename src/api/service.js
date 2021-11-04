import gql from "graphql-tag";

export const schema = gql`
  type ServiceVendor {
    id: String!
    name: String!
    config: JSON
    supportsOrgConfig: Boolean!
  }

  type ServiceManager {
    id: String!
    name: String!
    displayName: String!
    data: JSON
    supportsOrgConfig: Boolean!
    supportsCampaignConfig: Boolean!
    fullyConfigured: Boolean
    startPolling: Boolean
    unArchiveable: Boolean
    organization: Organization
    campaign: Campaign
  }
`;
