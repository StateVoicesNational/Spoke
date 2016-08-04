import React from 'react'
import { connect } from 'react-apollo'
import loadData from './load-data'
import { log } from '../../lib'
import makeAsyncScriptLoader from 'react-async-script'
import gql from 'graphql-tag'

  const mapQueriesToProps = ({ ownProps }) => {
    return {
      data: {
        query: gql`query getStripePublishableKey {
          stripePublishableKey
        }`,
      }
    }}

const loadStripe = (Component) => {
  class LoadStripe extends React.Component {
    onScriptLoad = () => {
      const { stripePublishableKey } = this.props.data
      Stripe.setPublishableKey(stripePublishableKey)
    }

    render() {
      const WrappedComponent = makeAsyncScriptLoader(
        () => <Component
          {...this.props}
        />,
        'https://js.stripe.com/v2/',
        {
          globalName: 'Stripe',
        }
      )
      return (
        <WrappedComponent
          asyncScriptOnLoad={this.onScriptLoad}
        />
      )
    }
  }

  return connect({ mapQueriesToProps })(LoadStripe)
}

export default loadStripe

