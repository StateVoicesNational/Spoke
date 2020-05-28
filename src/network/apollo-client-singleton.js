import fetch from "isomorphic-fetch";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { createHttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import { InMemoryCache } from "apollo-cache-inmemory";
import { getMainDefinition } from "apollo-utilities";
import omitDeep from "omit-deep-lodash";

const httpLink = createHttpLink({
  uri:
    (typeof window === "undefined" ? process.env : window).GRAPHQL_URL ||
    "/graphql",
  credentials: "same-origin"
});

const errorLink = onError(({ networkError = {}, graphQLErrors }) => {
  if (networkError.statusCode === 401) {
    window.location = `/login?nextUrl=${window.location.pathname}`;
  } else if (networkError.statusCode === 403) {
    window.location = "/";
  } else if (networkError.statusCode === 404) {
    window.location = "/404";
  }
});

// See https://github.com/apollographql/apollo-feature-requests/issues/6#issuecomment-576687277
const cleanTypenameLink = new ApolloLink((operation, forward) => {
  const keysToOmit = ["__typename"]; // more keys like timestamps could be included here

  const def = getMainDefinition(operation.query);
  if (def && def.operation === "mutation") {
    operation.variables = omitDeep(operation.variables, keysToOmit);
  }
  return forward ? forward(operation) : null;
});

const link = cleanTypenameLink.concat(errorLink).concat(httpLink);

const cache = new InMemoryCache({
  addTypename: true
});

const ApolloClientSingleton = new ApolloClient({
  link,
  cache,
  connectToDevTools: true,
  queryDeduplication: true
});
//
// import { graphQLErrorParser } from "./errors";
//
//
// const ApolloClientSingleton = new ApolloClient({
//   uri: process.env.GRAPHQL_URL || "/graphql",
//   onError: ({ graphQLErrors, networkError }) => {
//     console.info("**** Error", error);
//     // TODO: rather than use these status codes, use Apollo's built in string error codes
//     if (networkError.statusCode === 401) {
//       window.location = `/login?nextUrl=${window.location.pathname}`;
//     } else if (networkError.statusCode === 403) {
//       window.location = "/";
//     } else if (networkError.statusCode === 404) {
//       window.location = "/404";
//     } else {
//       console.error(
//         `GraphQL request resulted in error:\nRequest:${JSON.stringify(
//           error.response.data
//         )}\nError:${JSON.stringify()}`
//       );
//     }
//   }
// });

if (typeof window !== "undefined") {
  window.ApolloClient = ApolloClientSingleton;
}

export default ApolloClientSingleton;
