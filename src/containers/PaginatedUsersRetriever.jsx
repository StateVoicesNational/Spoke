import gql from 'graphql-tag'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { withRouter } from 'react-router'
import loadData from './hoc/load-data'

export class PaginatedUsersRetriever extends Component {
  componentDidMount() {
    this.handleUsersReceived()
  }

  componentDidUpdate(prevProps) {
    if (this.props.forceUpdateTime !== prevProps.forceUpdateTime) {
      this.props.users.refetch()
      return
    }
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
          returnValue.people.users = returnValue.people.users.concat(
            fetchMoreResult.data.people.users
          )
          returnValue.people.pageInfo = fetchMoreResult.data.people.pageInfo
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
        $sortBy: SortPeopleBy
        ) {
            people(
                organizationId: $organizationId
                cursor: $cursor
                campaignsFilter: $campaignsFilter
                sortBy: $sortBy
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
                        email
                        roles(organizationId: $organizationId)
                    }
                }
            }
        }
    `,
    variables: {
      cursor: { offset: 0, limit: ownProps.pageSize },
      organizationId: ownProps.organizationId,
      campaignsFilter: ownProps.campaignsFilter,
      sortBy: ownProps.sortBy || 'FIRST_NAME'
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
  sortBy: PropTypes.string,
  onUsersReceived: PropTypes.func.isRequired,
  pageSize: PropTypes.number.isRequired,
  forceUpdateTime: PropTypes.number
}

export default loadData(withRouter(PaginatedUsersRetriever), { mapQueriesToProps })
