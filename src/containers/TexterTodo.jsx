import PropTypes from 'prop-types'
import React from 'react'
import AssignmentTexter from '../components/AssignmentTexter'
import { withRouter } from 'react-router'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'

class TexterTodo extends React.Component {
  componentWillMount() {
    const { assignment } = this.props.data
    this.assignContactsIfNeeded()
    if (!assignment || assignment.campaign.isArchived) {
      this.props.history.push(
        `/app/${this.props.match.params.organizationId}/todos`
      )
    }
  }

  assignContactsIfNeeded = async (checkServer = false) => {
    const { assignment } = this.props.data
    if (assignment.contacts.length == 0 || checkServer) {
      if (assignment.campaign.useDynamicAssignment) {
        const didAddContacts = (await this.props.mutations.findNewCampaignContact(assignment.id, 1)).data.findNewCampaignContact.found
        if (didAddContacts) {
          this.props.data.refetch()
          return
        }
      }
      this.props.history.push(
        `/app/${this.props.match.params.organizationId}/todos`
      )
    }
  }

  refreshData = () => {
    this.props.data.refetch()
  }

  render() {
    const { assignment } = this.props.data
    const contacts = assignment.contacts
    const allContacts = assignment.allContacts
    return (
      <AssignmentTexter
        assignment={assignment}
        contacts={contacts}
        allContacts={allContacts}
        assignContactsIfNeeded={this.assignContactsIfNeeded.bind(this)}
        refreshData={this.refreshData.bind(this)}
        onRefreshAssignmentContacts={this.refreshAssignmentContacts}
        organizationId={this.props.match.params.organizationId}
      />
    )
  }
}

TexterTodo.propTypes = {
  contactsFilter: PropTypes.string,
  messageStatus: PropTypes.string,
  match: PropTypes.object,
  data: PropTypes.object,
  history: PropTypes.object
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
          useDynamicAssignment
          organization {
            id
            textingHoursEnforced
            textingHoursStart
            textingHoursEnd
            threeClickEnabled
          }
          customFields
          interactionSteps {
            id
            question {
              text
              answerOptions {
                value
                nextInteractionStep {
                  id
                  script
                }
              }
            }
          }
        }
        contacts(contactsFilter: $contactsFilter) {
          id
          customFields
        }
        allContacts: contacts {
          id
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

const mapMutationsToProps = () => ({
  findNewCampaignContact: (assignmentId, numberContacts = 1) => ({
    mutation: gql`
      mutation findNewCampaignContact($assignmentId: String!, $numberContacts: Int!) {
        findNewCampaignContact(assignmentId: $assignmentId, numberContacts: $numberContacts) {
          found
        }
      }
    `,
    variables: {
      assignmentId,
      numberContacts
    }
  })
})

export default loadData(withRouter(TexterTodo), { mapQueriesToProps, mapMutationsToProps })
