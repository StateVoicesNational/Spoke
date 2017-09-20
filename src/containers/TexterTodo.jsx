import React from 'react'
import AssignmentTexter from '../components/AssignmentTexter'
import { withRouter } from 'react-router'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'

class TexterTodo extends React.Component {
  componentWillMount() {
    const { assignment } = this.props.data
    if (!assignment || assignment.campaign.isArchived) {
      this.props.router.push(
        `/app/${this.props.params.organizationId}/todos`
      )
    }
  }

  refreshAssignmentContacts = () => this.props.data.refetch()

  render() {
    const { assignment } = this.props.data
    const contacts = assignment.contacts
    return (<AssignmentTexter
      assignment={assignment}
      contacts={contacts}
      onRefreshAssignmentContacts={this.refreshAssignmentContacts}
      organizationId={this.props.params.organizationId}
    />)
  }

}

TexterTodo.propTypes = {
  contactsFilter: React.PropTypes.string,
  params: React.PropTypes.object,
  data: React.PropTypes.object,
  router: React.PropTypes.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getContacts($assignmentId: String!, $contactsFilter: ContactsFilter!) {
      assignment(id: $assignmentId) {
        id
        userCannedResponses {
          id
          title
          text
          isUserCreated
        }
        campaignCannedResponses {
          id
          title
          text
          isUserCreated
        }
        texter {
          id
          firstName
          lastName
          assignedCell
        }
        campaign {
          id
          isArchived
          organization {
            id
            textingHoursEnforced
            textingHoursStart
            textingHoursEnd
            threeClickEnabled
          }
          customFields
        }
        contacts(contactsFilter: $contactsFilter) {
          id
          customFields
        }
      }
    }`,
    variables: {
      contactsFilter: {
        messageStatus: ownProps.messageStatus,
        isOptedOut: false,
        validTimezone: true
      },
      assignmentId: ownProps.params.assignmentId
    },
    forceFetch: true
  }
})

export default loadData(withRouter(TexterTodo), { mapQueriesToProps })
