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
      this.props.router.push(
        `/app/${this.props.params.organizationId}/todos`
      )
    }
  }

  assignContactsIfNeeded = async (checkServer = false) => {
    const { assignment } = this.props.data
    if ((assignment.contacts.length == 0 || checkServer) && assignment.campaign.useDynamicAssignment) {
      
      const didAddContacts = await this.props.mutations.findNewCampaignContact(assignment.id)

      if (didAddContacts){
        this.props.data.refetch()
      } else {
        this.props.router.push(
          `/app/${this.props.params.organizationId}/todos`
        )   
      }
    } else {
      this.props.router.push(
        `/app/${this.props.params.organizationId}/todos`
      )         
    }
  }

  render() {
    const { assignment } = this.props.data
    const contacts = assignment.contacts
    return (<AssignmentTexter
      assignment={assignment}
      contacts={contacts}
      assignContactsIfNeeded={this.assignContactsIfNeeded.bind(this)}
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
          useDynamicAssignment
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

const mapMutationsToProps = () => ({
  findNewCampaignContact: (assignmentId) => ({
    mutation: gql`
      mutation findNewCampaignContact($assignmentId: String!) {
        findNewCampaignContact(assignmentId: $assignmentId) {
          id
        }
      }
    `,
    variables: {
      assignmentId
    }
  })
})

export default loadData(withRouter(TexterTodo), { mapQueriesToProps, mapMutationsToProps })
