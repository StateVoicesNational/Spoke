export const schema = `
  type Tag {
    id: ID
    name: String
    group: String
    description: String
    isDeleted: Boolean
    organizationId: String
  }

  type TagsList {
    tags: [Tag]
  }
`;
