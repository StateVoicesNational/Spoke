import { GraphQLError } from "graphql/error";

export class GraphQLErrorWithStatus extends GraphQLError {
  constructor(message, status, ...otherArgs) {
    super(message, otherArgs);
    this.status = status;
  }
}

export { GraphQLError };
