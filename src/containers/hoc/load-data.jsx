import React from "react";
import { graphql, compose, withApollo } from "react-apollo";
import { withProps, branch, renderComponent } from "recompose";

import { Card, CardHeader, CardText } from "material-ui/Card";

// https://www.apollographql.com/docs/react/v2.5/recipes/recompose/

import LoadingIndicator from "../../components/LoadingIndicator";
import { CardActions, RaisedButton } from "material-ui";

/**
 * This HOC takes a list of GraphQL query names and adds a loading prop that is true if any of the
 * queries are loading.
 * @param {string[]} queryNames The names of the queries to check loading state
 */
const isLoading = queryNames =>
  withProps(parentProps => {
    const loadingReducer = (loadingAcc, queryName) =>
      loadingAcc || parentProps[queryName].loading;
    const loading = queryNames.reduce(loadingReducer, false);

    const errorReducer = (errorAcc, queryName) => {
      const error = parentProps[queryName].error;
      return error ? errorAcc.concat([error]) : errorAcc;
    };
    const errors = queryNames.reduce(errorReducer, []);

    return { loading, errors };
  });

export const withQueries = (queries = {}) => {
  const enhancers = Object.entries(
    queries
  ).map(([name, { query: queryGql, ...config }]) =>
    graphql(queryGql, { ...config, name })
  );

  return compose(...enhancers, isLoading(Object.keys(queries)));
};

const withMutations = (mutations = {}) =>
  compose(
    withApollo,
    withProps(parentProps => {
      const reducer = (propsAcc, [name, constructor]) => {
        propsAcc[name] = async (...args) => {
          const options = constructor(parentProps)(...args);
          return await parentProps.client.mutate(options);
        };
        return propsAcc;
      };

      const mutationFuncs = Object.entries(mutations).reduce(reducer, {});
      return { mutations: mutationFuncs };
    })
  );

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
    <CardText>
      <ul>
        {errors.map((err, index) => (
          <li key={index}>{err.message}</li>
        ))}
      </ul>
    </CardText>
    <CardActions>
      <RaisedButton label="Reload" onClick={() => window.location.reload()} />
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
    branch(({ loading }) => loading, renderComponent(LoadingIndicator)),
    branch(({ errors }) => errors.length > 0, renderComponent(PrettyErrors))
  );
