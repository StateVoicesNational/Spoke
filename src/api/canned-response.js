export const schema = `
  input CannedResponseInput {
    id: String
    title: String
    text: String
    campaignId: String
    userId: String
    tagIds: [Int]
  }

  type CannedResponse {
    id: ID
    title: String
    text: String
    isUserCreated: Boolean
    tagIds: [ID]
  }
`;
