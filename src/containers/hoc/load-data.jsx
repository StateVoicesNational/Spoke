import React from 'react'
import { connect, compose } from 'react-apollo'

import { log } from '../../lib'
import { wrapQueries, newWrapMutations } from '../hoc/wrap-mutations'
import LoadingIndicator from '../../components/LoadingIndicator'

export const renderWhileLoading = (propNames = []) =>
  branch(
    props => {
      let loading = false
      propNames.forEach(propName => {
        loading = loading || (props[propName] && props[propName].loading)
      })
      return loading
    },
    renderComponent(<LoadingIndicator />),
  )

export const newLoadData = ({ queries = {}, mutations = {} } = {}) => {
  const queryNames = Object.keys(queries)
  const wrappedQueries = wrapQueries(queries)
  const wrappedMutations = newWrapMutations(mutations)
  return compose(
    ...wrappedQueries,
    ...wrappedMutations,
    renderWhileLoading(queryNames)
  )
}

const loadData = (Component, connectArgs) => {
  class LoadData extends React.Component {
    state = {
      data: null
    }

    // This ensures that the loading
    // indicator only shows on the first
    // load and not when refetch is called
    componentWillReceiveProps(props) {
      if (!this.isLoading(props) || this.state.data !== null) {
        this.setState({
          data: this.dataProps(props)
        })
      }
    }

    dataProps(props) {
      const newProps = {}
      Object
        .keys(props)
        .forEach((propName) => {
          const prop = props[propName]
          if (prop &&
            prop.hasOwnProperty('loading') &&
            prop.hasOwnProperty('errors') &&
            prop.hasOwnProperty('refetch')) {
            newProps[propName] = prop
          }
        })
      return newProps
    }

    isLoading(props) {
      let isLoading = false
      Object
        .keys(this.dataProps(props))
        .forEach((propName) => {
          if (props[propName].loading) {
            isLoading = true
          }
        })
      return isLoading
    }

    render() {
      const dataProps = this.dataProps(this.props)
      Object.keys(dataProps).forEach((prop) => {
        if (dataProps[prop].errors) {
          log.error('ERROR IN REQUEST', dataProps[prop].errors)
        }
      })
      if (this.isLoading(this.props) && this.state.data === null) {
        return <LoadingIndicator />
      }
      return <Component {...this.props} {...this.state.data} />
    }
  }

  return connect(connectArgs)(LoadData)
}

export default loadData
