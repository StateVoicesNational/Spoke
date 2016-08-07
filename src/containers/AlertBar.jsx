import React from 'react'
import FlatButton from 'material-ui/FlatButton'
import gql from 'graphql-tag'
import { withRouter } from 'react-router'
import wrapMutations from './hoc/wrap-mutations'
import { css, StyleSheet } from 'aphrodite'
import { connect } from 'react-apollo'

const styles = StyleSheet.create({
  alert: {
    color: 'orange',
    padding: 20,
    marginBottom: 20,
  }
})

class AlertBar extends React.Component {
  render() {
    const { organization } = this.props.data
    if (!organization) {
      return <div />
    }

    const { organizationId } = this.props
    const { billingDetails, plan } = organization
    const balanceLow = billingDetails.balanceAmount < plan.amountPerMessage
    const billingLink = (
      <FlatButton
        onTouchTap={() => this.props.router.push(`/admin/${organizationId}/billing`)}
        label='Go to billing'
      />
    )
    return balanceLow ?
      (
        <div className={css(styles.alert)}>
          Your account does not have enough credit to send any more messages.
          {billingLink}
        </div>
      ) : null
  }
}

AlertBar.propTypes = {
  data: React.PropTypes.object,
  router: React.PropTypes.object,
  location: React.PropTypes.string,
  organizationId: React.PropTypes.string
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getOrganization($organizationId: String!) {
      organization(id: $organizationId) {
        id
        plan {
          id
          amountPerMessage
        }
        billingDetails {
          balanceAmount
        }

      }
    }`,
    variables: {
      organizationId: ownProps.organizationId
    },
    forceFetch: true
  }
})

export default connect({
  mapQueriesToProps
})(withRouter(AlertBar))

