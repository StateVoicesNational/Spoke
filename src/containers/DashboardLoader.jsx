import PropTypes from 'prop-types';
import React from 'react'
import gql from 'graphql-tag'
import { withRouter } from 'react-router'
import { compose } from 'recompose'
import { graphql } from 'react-apollo'
import loadData from './hoc/load-data'

class DashboardLoader extends React.Component {
  componentWillMount() {
    if (this.props.data.currentUser.organizations.length > 0) {
      this.props.router.push(
        `${this.props.path}/${this.props.data.currentUser.organizations[0].id}`
        )
    } else {
      this.props.router.push('/')
    }
  }

  render() {
    return <div></div>
  }
}

DashboardLoader.propTypes = {
  data: PropTypes.object,
  router: PropTypes.object,
  path: PropTypes.string
}

const query = graphql(gql`
  query getCurrentUserForLoader {
    currentUser {
      id
      organizations {
        id
      }
    }
  }
`)

export default compose(query, loadData, withRouter)(DashboardLoader)
