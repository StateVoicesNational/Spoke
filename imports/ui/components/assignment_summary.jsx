import React, { Component } from 'react'
import { Texter } from './texter'
import { TexterNavigationToolbar } from './texter_navigation_toolbar'

const styles = {
  base: {
    marginTop: '24px'
  }
}
export class AssignmentSummary extends Component {
  constructor(props) {
    super(props)

    this.state = {
      currentContactIndex: 0
    }

    this.handleNavigateNext = this.handleNavigateNext.bind(this)
    this.handleNavigatePrevious = this.handleNavigatePrevious.bind(this)
  }

  contactCount() {
    const { contacts } = this.props
    return contacts.length
  }

  hasPrevious() {
    return this.state.currentContactIndex > 0
  }

  hasNext() {
    return this.state.currentContactIndex < this.contactCount() - 1
  }

  handleNavigateNext() {
    if (this.hasNext())
      this.incrementCurrentContactIndex(1)
  }

  handleNavigatePrevious() {
    this.incrementCurrentContactIndex(-1)
  }

  navigationTitle(contact) {
    const currentCount = this.state.currentContactIndex + 1
    console.log("navigationTitle", contact)
    return contact.name + ' - ' + currentCount + '/' + this.contactCount() + ' messages'
  }

  incrementCurrentContactIndex(increment) {
    let newIndex = this.state.currentContactIndex
    newIndex = newIndex + increment
    this.updateCurrentContactIndex(newIndex)
  }

  updateCurrentContactIndex(newIndex) {
    this.setState({
      currentContactIndex: newIndex
    })
  }

  currentContact() {
    const { contacts } = this.props
    const index = this.state.currentContactIndex
    return (index >= contacts.length) ? null : contacts[index]
  }
  render() {
    const { assignment, contacts, survey, messages } = this.props
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
        const navigation = (
          <TexterNavigationToolbar
            contact={this.currentContact()}
            contactIndex={this.state.currentContactIndex}
            contactCount={contacts.length}
            hasPrevious={this.hasPrevious()}
            hasNext={this.hasNext()}
            onPrevious={this.handleNavigatePrevious}
            onNext={this.handleNavigateNext}
          />
        )
        //TODO - do we really want to grab all messages at once here?
        const filteredMessages = messages.filter((message) => message.contactNumber == this.currentContact().number )
      return (
        <div style={styles.base}>
          {navigation}
            <Texter
              assignment={assignment}
              contact={this.currentContact()}
              messages={filteredMessages}
              survey={survey}
              onNextContact={this.handleNavigateNext}
            />
        </div>
        )
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
}

AssignmentSummary.propTypes = {
  assignment: React.PropTypes.object,      // current assignment
  messages: React.PropTypes.array,   // contacts for current assignment
  contacts: React.PropTypes.array,   // contacts for current assignment
  survey: React.PropTypes.object   // contacts for current assignment
}


