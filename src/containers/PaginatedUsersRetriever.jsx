import gql from 'graphql-tag'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { withRouter } from 'react-router'
import loadData from './hoc/load-data'

export class PaginatedUsersRetriever extends Component {
  constructor(props) {
    super(props)

    this.state = { offset: 0 }
  }

  componentDidMount() {
    this.handleUsersReceived()
  }

  componentDidUpdate(prevProps) {
    this.handleUsersReceived()
  }

  handleUsersReceived() {
    if (!this.props.users || this.props.users.loading) {
      return
    }

    if (
      this.props.users.people.users.length ===
      this.props.users.people.pageInfo.total
    ) {
      this.props.onUsersReceived(this.props.users.people.users)
    }

    const newOffset = this.props.users.people.pageInfo.offset + this.props.pageSize
    if (newOffset < this.props.users.people.pageInfo.total) {
      this.props.users.fetchMore({
        variables: {
          cursor: {
            offset: newOffset,
            limit: this.props.pageSize
          }
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return prev
          }
          const returnValue = Object.assign({}, prev)
          returnValue.users.people = returnValue.users.people.concat(
            fetchMoreResult.data.users.people
          )
          returnValue.users.pageInfo = fetchMoreResult.data.users.pageInfo
          return returnValue
        }
      })
    }
  }

  render() {
    return null
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  users: {
    query: gql`
        query getUsers(
        $organizationId: String!
        $cursor: OffsetLimitCursor
        $campaignsFilter: CampaignsFilter
        ) {
            people(
                organizationId: $organizationId
                cursor: $cursor
                campaignsFilter: $campaignsFilter
            ) {
                ...on PaginatedUsers {
                    pageInfo {
                        offset
                        limit
                        total
                    }
                    users {
                        id
                        displayName
                        roles(organizationId: $organizationId)
                    }
                }
            }
        }
    `,
    variables: {
      cursor: { offset: 0, limit: ownProps.pageSize },
      organizationId: ownProps.organizationId,
      campaignsFilter: ownProps.campaignsFilter
    },
    forceFetch: true
  }
})

PaginatedUsersRetriever.propTypes = {
  organizationId: PropTypes.string.isRequired,
  campaignsFilter: PropTypes.shape({
    isArchived: PropTypes.bool,
    campaignId: PropTypes.number
  }),
  onUsersReceived: PropTypes.func.isRequired,
  pageSize: PropTypes.number.isRequired
}

export default loadData(withRouter(PaginatedUsersRetriever), { mapQueriesToProps })

