import React from 'react'
import AssignmentTexter from '../components/AssignmentTexter'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'

class TexterTodo extends React.Component {
  render() {
    const { assignment } = this.props.data.currentUser
    const contacts = assignment.contacts

    return (<AssignmentTexter
      assignment={assignment}
      contacts={contacts}
    />)
  }
}

TexterTodo.propTypes = {
  contactsFilter: React.PropTypes.string,
  params: React.PropTypes.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getContacts($assignmentId: String!, $contactsFilter: ContactsFilter!) {
      currentUser {
        id
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
            organization {
              id
              threeClickEnabled
            }
            customFields
          }
          contacts(contactsFilter: $contactsFilter) {
            id
            customFields
          }
        }
      }
    }`,
    variables: {
      contactsFilter: {
        messageStatus: ownProps.messageStatus,
      },
      assignmentId: ownProps.params.assignmentId
    },
    forceFetch: true
  }
})

export default loadData(TexterTodo, { mapQueriesToProps })
