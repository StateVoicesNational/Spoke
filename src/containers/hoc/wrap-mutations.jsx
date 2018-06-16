import React from 'react'
import _ from 'lodash'

import { GraphQLRequestError, graphQLErrorParser } from '../../network/errors'

/*
Reference:

graphql(createBlankCampaign, {
  name: 'createBlankCampaign',
  // options: (props) => ({
  //   variables: { campaign: props.campaign }
  // }),
  // props: (props) => {
  //   const mutations = props.mutations || {}
  //   mutations['createBlankCampaign'] = (campaign) => props['createBlankCampaign']({
  //     variables: { campaign }
  //   })
  // }
})
*/

export const wrapQueries = (queries) => {
  const queryKeys = Object.keys(queries)
  const result = queryKeys.map(queryKey => {
    const query = queries[queryKey]
    const config = _.omit(query, ['gql'])
    config.name = config.name || queryKey
    return graphql(query.gql, config)
  })
  return result
}

export const newWrapMutations = (mutations) => {
  const mutationKeys = Object.keys(mutations)
  const result = mutationKeys.map(mutationKey => {
    const { gql } = mutations[mutationKey]
    return graphql(gql, {
      props: (props) => {
        const mutations = props.mutations || {}
        mutations[mutationKey] = (variables) => props[mutationKey]({ variables })
        props.mutations = mutations
        return props
      }
    })
  })
  return result
}

const wrapMutations = (Component) => (props) => {
  const newProps = { ...props }
  if (props.hasOwnProperty('mutations')) {
    const newMutations = {}
    // eslint-disable-next-line react/prop-types
    Object.keys(props.mutations).forEach((key) => {
      newMutations[key] = async (...args) => {
        const argCopy = [...args]
        // eslint-disable-next-line react/prop-types
        const resp = await props.mutations[key](...argCopy)
        const parsedError = graphQLErrorParser(resp)
        if (parsedError) {
          throw new GraphQLRequestError(parsedError)
        }
        return resp
      }
    })
    newProps.mutations = newMutations
  }
  return (
    <Component {...newProps} />
  )
}

export default wrapMutations
