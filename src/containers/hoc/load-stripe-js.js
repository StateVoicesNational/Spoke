import React from 'react'
import { connect } from 'react-apollo'
import makeAsyncScriptLoader from 'react-async-script'
import gql from 'graphql-tag'

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
          globalName: 'Stripe'
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

  LoadStripe.propTypes = {
    data: React.PropTypes.object
  }

  const mapQueriesToProps = () => ({
    data: {
      query: gql`query getStripePublishableKey {
        stripePublishableKey
      }`
    }
  })

  return connect({ mapQueriesToProps })(LoadStripe)
}

export default loadStripe

