export const schema = `
  input CannedResponseSendInput {
    id: String
    campaignContactId: String
    cannedResponseId: String
  }

  type CannedResponseSend {
    id: ID
    campaignContactId: String
    cannedResponseId: String
  }
`;
