export const schema = `
  type MediaItem {
    type: String
    url: String
  }

  type Message {
    id: ID
    text: String
    media: [MediaItem]
    userNumber: String
    contactNumber: String
    createdAt: Date
    isFromContact: Boolean
  }
`;
