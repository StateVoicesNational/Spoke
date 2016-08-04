import React from 'react'
import { connect } from 'react-apollo'
import loadData from './load-data'
import { log } from '../../lib'
import makeAsyncScriptLoader from 'react-async-script'
import gql from 'graphql-tag'

  const mapQueriesToProps = ({ ownProps }) => {
    console.log("HELLO!!!!", ownProps)
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
      console.log("HELLO ODONGO!", this.props)
      console.log("now what", Stripe)
      const { stripePublishableKey } = this.props.data
      Stripe.setPublishableKey(stripePublishableKey)
    }

    render() {
      console.log("this.props", this.props)
      const WrappedComponent = makeAsyncScriptLoader(
        () => <Component
          {...this.props}
        />,
        'https://js.stripe.com/v2/',
        {
          globalName: 'Stripe',
        }
      )
      // const Wrapper = connect({ mapQueriesToProps })(WrappedComponent)
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

