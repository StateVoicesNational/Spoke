import React from 'react'
import { GraphQLRequestError, graphQLErrorParser } from '../../network/errors'

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
