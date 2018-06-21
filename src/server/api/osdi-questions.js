/* Schema that defines a list of questions fetched from an OSDI service */

export const schema = `
  type QuestionList {
    questions: [String!]
  }
`
