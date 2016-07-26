import React from 'react'
import { connect } from 'react-apollo'
import LoadingIndicator from '../../components/LoadingIndicator'
import { log } from '../../lib'

const loadData = (Component, connectArgs) => {
  class LoadData extends React.Component {
    state = {
      data: null
    }

    // This ensures that the loading
    // indicator only shows on the first
    // load and not when refetch is called
    componentWillReceiveProps(props) {
      if (!this.isLoading(props)) {
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
