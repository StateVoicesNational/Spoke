import React from "react";
import { graphql } from "@apollo/client/react/hoc";
import { flowRight as compose } from "lodash";

import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";

import ApolloClientSingleton from "../../network/apollo-client-singleton";

// https://www.apollographql.com/docs/react/v2.5/recipes/recompose/

import LoadingIndicator from "../../components/LoadingIndicator";

/**
 * This HOC takes a list of GraphQL query names and adds a loading prop that is true if any of the
 * queries are loading.
 * @param {string[]} queryNames The names of the queries to check loading state
 */

// The isLoading function below utilizes currying, a technique where a function
// returns another function with specific parameters. The purpose is to create a
// sequence of functions, making it flexible and reusable. In this case,
// isLoading is curried to take queryNames, then the Component, and finally
// parentProps. ie: isLoading(queryNames)(Component)(parentProps)

const isLoading = queryNames => Component => parentProps => {
  const loadingReducer = (loadingAcc, queryName) =>
    loadingAcc || (parentProps[queryName] && parentProps[queryName].loading);
  const loading = queryNames.reduce(loadingReducer, false);

  const errorReducer = (errorAcc, queryName) => {
    const error = parentProps[queryName] && parentProps[queryName].error;
    return error ? errorAcc.concat([error]) : errorAcc;
  };
  const errors = queryNames.reduce(errorReducer, []);
  return <Component {...parentProps} loading={loading} errors={errors} />;
};

export const withQueries = (queries = {}) => {
  const enhancers = Object.entries(
    queries
  ).map(([name, { query: queryGql, skip, ...config }]) =>
    graphql(queryGql, { ...config, skip, name })
  );

  return compose(...enhancers, isLoading(Object.keys(queries)));
};

const withMutations = (mutations = {}) => {
  const withClient = Component => props => (
    <Component {...props} client={ApolloClientSingleton} />
  );

  const withMutationFuncs = Component => props => {
    const mutationFuncs = Object.entries(mutations).reduce(
      (propsAcc, [name, constructor]) => {
        propsAcc[name] = async (...args) => {
          const options = constructor(props)(...args);
          return await props.client.mutate(options);
        };
        return propsAcc;
      },
      {}
    );

    return <Component {...props} mutations={mutationFuncs} />;
  };

  return compose(withClient, withMutationFuncs);
};

/**
 * Takes multiple GraphQL queries and/or mutation definitions and wraps Component in appropriate
 * graphql() calls.
 */
const withOperations = options => {
  const { queries = {}, mutations = {} } = options;
  return compose(withQueries(queries), withMutations(mutations));
};

const PrettyErrors = ({ errors }) => (
  <Card style={{ margin: "10px" }}>
    <CardHeader title="Encountered errors" />
    <CardContent>
      <ul>
        {errors.map((err, index) => (
          <li key={index}>{err.message}</li>
        ))}
      </ul>
    </CardContent>
    <CardActions>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </CardActions>
  </Card>
);

/**
 * Similar to {@link withOperations}, but shows a loading indicator if any of the queries are loading.
 *
 * @param {Object} options
 * @see withOperations
 */

export default options =>
  compose(
    withOperations(options),
    Component => ({ loading, errors, ...props }) => {
      if (loading) {
        return <LoadingIndicator />;
      } else if (errors.length > 0) {
        return <PrettyErrors errors={errors} />;
      } else {
        return <Component {...props} />;
      }
    }
  );
