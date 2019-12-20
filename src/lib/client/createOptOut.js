import gql from "graphql-tag";

export const createOptOutGqlString = `mutation createOptOut(
    $organizationId: String!
    $optOut: OptOutInput!
    $campaignContactId: String!
  ) {
    createOptOut(
      optOut: $optOut
      campaignContactId: $campaignContactId
      organizationId: $organizationId
    ) {
      id
    }
  }`;

export const createOptOutGql = gql`
  ${createOptOutGqlString}
`;

const createOptOutMutation = (organizationId, optOut, campaignContactId) => ({
  mutation: createOptOutGql,
  variables: {
    organizationId,
    optOut,
    campaignContactId
  }
});

export default createOptOutMutation;
