import React from 'react'
import FlatButton from 'material-ui/FlatButton'
import gql from 'graphql-tag'
import { withRouter } from 'react-router'
import wrapMutations from './hoc/wrap-mutations'
import { css, StyleSheet } from 'aphrodite'
import { connect } from 'react-apollo'
import theme from '../styles/theme'

const styles = StyleSheet.create({
  alert: {
    color: theme.colors.white,
    paddingLeft: 20,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 20,
    marginBottom: 20,
    backgroundColor: theme.colors.orange,
    display: 'flex'
  },
  alertText: {
    flex: 1,
    marginTop: 'auto',
    marginBottom: 'auto'
  },
  alertButton: {
    textAlign: 'right'
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
        style={{
          marginLeft: 20,
          color: theme.colors.white,
          backgroundColor: theme.colors.green
        }}
        label='Go to billing'
      />
    )
    return balanceLow ?
      (
        <div className={css(styles.alert)}>
          <div className={css(styles.alertText)}>
            Your account does not have enough credit to send any more messages.
          </div>
          <div className={css(styles.alertButton)}>
            {billingLink}
          </div>
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

