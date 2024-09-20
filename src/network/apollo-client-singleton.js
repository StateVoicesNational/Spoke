import fetch from "isomorphic-fetch";
import { ApolloClient, ApolloLink } from "@apollo/client";
import { createHttpLink } from "@apollo/client/link/http";
import { onError } from "@apollo/client/link/error";
import { InMemoryCache } from "@apollo/client/cache";
import { getMainDefinition } from "@apollo/client/utilities";
import omitDeep from "omit-deep-lodash";

const httpLink = createHttpLink({
  fetch: fetch,
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
  addTypename: true,
  dataIdFromObject: result => {
    if (result.__typename === "ContactTag") {
      // This is all a hacky way to resolve the issue of using ContactTag.id for the tagId
      if (result.campaignContactId && result.id) {
        return (
          result.__typename + ":" + result.campaignContactId + ":" + result.id
        );
      } else {
        return null; // can't cache
      }
    }
    if (result.__typename) {
      if (result.id !== undefined) {
        return result.__typename + ":" + result.id;
      }
      if (result._id !== undefined) {
        return result.__typename + ":" + result._id;
      }
    }
    return null;
  },
  typePolicies: {
    ContactTag: {
      // key is just the tag id and the value is contact-specific
      keyFields: false
    },
    // Define custom merge functions for multiple fields
    // https://go.apollo.dev/c/merging-non-normalized-objects
    // https://www.apollographql.com/docs/react/caching/cache-field-behavior/#merging-arrays
    Query: {
      fields: {
        organization: {
          merge: true
        }
      }
    },
    Campaign: {
      fields: {
        ingestMethod: {
          merge: true
        },
        pendingJobs: {
          merge(existing = [], incoming) {
            return incoming;
          }
        }
      }
    },
    Organization: {
      fields: {
        pendingPhoneNumberJobs: {
          merge(existing = [], incoming) {
            return incoming;
          }
        }
      }
    }
  }
});

const ApolloClientSingleton = new ApolloClient({
  link,
  cache,
  connectToDevTools: true,
  queryDeduplication: true
});

export default ApolloClientSingleton;
