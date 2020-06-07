import gql from "graphql-tag";

export const schema = gql`
  type AppliedTag {
    name: String!
    value: String!
  }
`;
