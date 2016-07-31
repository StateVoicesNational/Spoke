import React from 'react'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import wrapMutations from './hoc/wrap-mutations'
import { withRouter } from 'react-router'


class Billing extends React.Component {
  render() {
    const { stripePublishableKey,  organization } = this.props.data
    const { creditAmount, creditCurrrency } = organization.billingDetails
    return (
      <div>
        { creditAmount } { creditCurrrency }
        <form action="" method="POST">
          <script
            src="https://checkout.stripe.com/checkout.js" className="stripe-button"
            data-key="pk_test_i0KKPhp0YFDX29qKVSaSIXm5"
            data-amount="999"
            data-name="Axle Factory Inc."
            data-description="Widget"
            data-image="/img/documentation/checkout/marketplace.png"
            data-locale="auto">
          </script>
        </form>
      </div>
    )
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query adminGetBilling($organizationId: String!) {
      organization(id: $organizationId) {
        billingDetails {
          creditAmount
          creditCurrency
        }
      },
      stripePublishableKey
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    }
  }
})

// const mapMutationsToProps = ({ ownProps }) => ({
//   joinOrganization: () => ({
//     mutation: gql`
//       mutation joinOrganization($organizationId: String!) {
//         joinOrganization(organizationId: $organizationId) {
//           id
//         }
//       }`,
//     variables: { organizationId: ownProps.params.organizationId }
//   })
// })


export default loadData(wrapMutations(Billing), { mapQueriesToProps })
