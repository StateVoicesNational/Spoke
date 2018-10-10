import PropTypes from 'prop-types'
import React from 'react'
import AssignmentTexter from '../components/AssignmentTexter'
import { withRouter } from 'react-router'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'

const contactDataFragment = `
        id
        assignmentId
        firstName
        lastName
        cell
        zip
        customFields
        optOut {
          id
        }
        questionResponseValues {
          interactionStepId
          value
        }
        location {
          city
          state
          timezone {
            offset
            hasDST
          }
        }
        messageStatus
        messages {
          id
          createdAt
          text
          isFromContact
        }
`

class TexterTodo extends React.Component {
  constructor() {
    super()
    this.assignContactsIfNeeded = this.assignContactsIfNeeded.bind(this)
    this.refreshData = this.refreshData.bind(this)
    this.loadContacts = this.loadContacts.bind(this)
  }
  componentWillUpdate(nextProps, nextState) {
    console.log('textertodo willupdate', this.props.data, nextProps.data)
  }

  componentWillMount() {
    const { assignment } = this.props.data
    this.assignContactsIfNeeded()
    if (!assignment || assignment.campaign.isArchived) {
      this.props.router.push(
        `/app/${this.props.params.organizationId}/todos`
      )
    }
  }

  assignContactsIfNeeded = async (checkServer = false, stayOnFail = false) => {
    const { assignment } = this.props.data
    // TODO: should we assign a single contact at first, and then afterwards assign 10
    //       to avoid people loading up the screen but doing nothing -- then they've 'taken' only one contact
    if (!this.loadingNewContacts && (assignment.contacts.length === 0 || checkServer)) {
      const didAddContacts = await this.getNewContacts()
      if (didAddContacts) {
        return
      }
      if (stayOnFail && !assignment.contacts.length) {
        return
      }
      console.log('ABOUT TO JUMP BACK', this.loadingAssignmentContacts, this.loadingNewContacts,
                  this.props.mutations.getAssignmentContacts.loading)
      this.props.router.push(
        `/app/${this.props.params.organizationId}/todos`
      )
    }
  }

  getNewContacts = async () => {
    const { assignment } = this.props.data
    if (assignment.campaign.useDynamicAssignment) {
      console.log('getnewContacts', assignment.contacts.map(c => c.id))
      this.loadingNewContacts = true
      const didAddContacts = (await this.props.mutations.findNewCampaignContact(assignment.id)).data.findNewCampaignContact.found
      console.log('getNewContacts ?added', didAddContacts)
      if (didAddContacts) {
        // ?BUG: this isn't awaited on, but does this affect the immediate event loop cycle?
        await this.props.data.refetch()
      }
      this.loadingNewContacts = false
      return didAddContacts
    }
  }

  loadContacts = async (contactIds) => {
    this.loadingAssignmentContacts = true
    const newContacts = await this.props.mutations.getAssignmentContacts(contactIds)
    this.loadingAssignmentContacts = false
    return newContacts
  }

  refreshData = () => {
    this.props.data.refetch()
  }

  render() {
    const { assignment } = this.props.data
    const contacts = assignment.contacts
    const allContactsCount = assignment.allContactsCount
    return (
      <AssignmentTexter
        assignment={assignment}
        contacts={contacts}
        allContactsCount={allContactsCount}
        assignContactsIfNeeded={this.assignContactsIfNeeded}
        refreshData={this.refreshData}
        loadContacts={this.loadContacts}
        getNewContacts={this.getNewContacts}
        onRefreshAssignmentContacts={this.refreshAssignmentContacts}
        organizationId={this.props.params.organizationId}
      />
    )
  }
}

TexterTodo.propTypes = {
  contactsFilter: PropTypes.string,
  messageStatus: PropTypes.string,
  params: PropTypes.object,
  data: PropTypes.object,
  mutations: PropTypes.object,
  router: PropTypes.object
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
            optOutMessage
          }
          customFields
          interactionSteps {
            id
            script
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
        }
        allContactsCount: contactsCount
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
    forceFetch: true,
    pollInterval: 20000
  }
})

const mapMutationsToProps = ({ ownProps }) => ({
  findNewCampaignContact: (assignmentId) => ({
    mutation: gql`
      mutation findNewCampaignContact($assignmentId: String!, $numberContacts: Int!) {
        findNewCampaignContact(assignmentId: $assignmentId, numberContacts: $numberContacts) {
          found
        }
      }
    `,
    variables: {
      assignmentId,
      numberContacts: 10
    }
  }),
  getAssignmentContacts: (contactIds, findNew) => ({
    mutation: gql`
      mutation getAssignmentContacts($assignmentId: String!, $contactIds: [String]!, $findNew: Boolean) {
        getAssignmentContacts(assignmentId: $assignmentId, contactIds: $contactIds, findNew: $findNew) {
          ${contactDataFragment}
        }
      }
    `,
    variables: {
      assignmentId: ownProps.params.assignmentId,
      contactIds,
      findNew: !!findNew
    }
  })
})

export default loadData(withRouter(TexterTodo), { mapQueriesToProps, mapMutationsToProps })
