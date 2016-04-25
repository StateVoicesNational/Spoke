import React from 'react'
import { Texter } from '../components/texter'

export const AssignmentSummary = (props) => {
  const { assignment, contacts, surveys } = props
  if (!assignment) {
    return (
      <div>
        You don't have any assignments yet
      </div>
    )
  } else if (contacts.length === 0) {
    return (
      <div>
        You have no contacts!
      </div>
    )
  } else {
    return <Texter assignment={assignment} contacts={contacts} surveys={surveys} />
    // const unmessagedContacts = contacts.filter(contact => !contact.lastMessage);
    // if (unmessagedContacts.length > 0) {
    //   return <Texter assignment={assignment} contacts={unmessagedContacts} surveys={surveys} />
    // } else {
    //   const unrespondedContacts = contacts.filter(contact => contact.lastMessage.isFromContact);
    //   if (unrespondedContacts.length > 0) {
    //     return <Texter assignment={assignment} contacts={unrespondedContacts} surveys={surveys} />
    //   } else {
    //     return <div>You have nothing to respond to right now! Great job</div>
    //   }
    // }
  }
}

AssignmentSummary.propTypes = {
  assignment: React.PropTypes.object,      // current assignment
  contacts: React.PropTypes.array,   // contacts for current assignment
  surveys: React.PropTypes.array   // contacts for current assignment
}


