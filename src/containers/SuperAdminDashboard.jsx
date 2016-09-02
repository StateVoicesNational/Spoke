import React from 'react'
import gql from 'graphql-tag'
import { withRouter } from 'react-router'
import loadData from './hoc/load-data'

class SuperAdminDashboard extends React.Component {
  render() {
    return (
      <div>
        { this.props.data.organizations.map((organization) => (
            <div>
              {organization.name}
            </div>
          ))
        }
      </div>
    )
  }
}

SuperAdminDashboard.propTypes = {
  data: React.PropTypes.object,
  router: React.PropTypes.object,
  path: React.PropTypes.string
}

const mapQueriesToProps = () => ({
  data: {
    query: gql`query getAllOrganizations {
      organizations {
        id
        name
        billingDetails {
          creditCurrency
          balanceAmount
        }
      }
    }`,
    forceFetch: true
  }
})

export default loadData(withRouter(SuperAdminDashboard), { mapQueriesToProps })
