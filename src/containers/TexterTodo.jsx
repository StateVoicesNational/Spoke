import React from 'react'
import AssignmentTexter from '../components/AssignmentTexter'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'

class TexterTodo extends React.Component {
  render() {
    const { assignment } = this.props.data.currentUser
    console.log(this.props.data)
    const contacts = assignment.contacts.data

    return (<AssignmentTexter
      assignment={assignment}
      contacts={contacts}
    />)
  }
}

TexterTodo.propTypes = {
  contactFilter: React.PropTypes.string,
  params: React.PropTypes.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getContacts($assignmentId: String!, $contactFilter: String!) {
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
            contacts {
              customFields
            }
          }
          contacts {
            data(contactFilter: $contactFilter) {
              id
              customFields
            }
          }
        }
      }
    }`,
    variables: {
      contactFilter: ownProps.contactFilter, // FIXME
      assignmentId: ownProps.params.assignmentId
    }
  }
})

export default loadData(TexterTodo, { mapQueriesToProps })
