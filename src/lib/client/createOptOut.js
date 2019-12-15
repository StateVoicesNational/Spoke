import gql from "graphql-tag";

const createOptOutMutation = (organizationId, optOut, campaignContactId) => ({
  mutation: createOptOutGql,
  variables: {
    organizationId,
    optOut,
    campaignContactId
  }
});

export const createOptOutGql = gql`
  mutation createOptOut(
    $organizationId: String!
    $optOut: OptOutInput!
    $campaignContactId: String!
  ) {
    createOptOut(
      optOut: $optOut
      campaignContactId: $campaignContactId
      organizationId: $organixzationId
    ) {
      id
    }
  }
`;

export default createOptOutMutation;
