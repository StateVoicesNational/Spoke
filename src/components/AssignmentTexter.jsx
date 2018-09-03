import PropTypes from 'prop-types'
import React from 'react'
import { ToolbarTitle } from 'material-ui/Toolbar'
import IconButton from 'material-ui/IconButton/IconButton'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'
import AssignmentTexterContact from '../containers/AssignmentTexterContact'
import { StyleSheet, css } from 'aphrodite'
import { withRouter } from 'react-router'
import Check from 'material-ui/svg-icons/action/check-circle'
import Empty from '../components/Empty'
import RaisedButton from 'material-ui/RaisedButton'

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    // right: 0,
    // bottom: 0
    width: '100%',
    height: '100%',
    zIndex: 1002,
    backgroundColor: 'white',
    overflow: 'hidden'
  },
  navigationToolbarTitle: {
    fontSize: '12px'
  }
})

class AssignmentTexter extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      // currentContactIndex: 0,
      contactCache: {},
      direction: 'right'
    }
  }

  componentWillMount() {
    this.updateCurrentContactIndex(0)
    const self = this
    this.refreshInterval = setInterval(() => self.props.refreshData(), 20000)
  }
  componentWillUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  }

  componentWillUpdate(nextProps, nextState) {
    /// When we send a message that changes the contact status,
    /// then if parent.refreshData is called, then props.contacts
    /// will return a new list with the last contact removed and
    /// presumably our currentContactIndex will be off.
    /// In fact, without the code below, we will 'double-jump' each message
    /// we send or change the status in some way.
    /// Below, we update our index with the contact that matches our current index.
    if (typeof nextState.currentContactIndex != 'undefined'
        && nextState.currentContactIndex === this.state.currentContactIndex
        && nextProps.contacts.length != this.props.contacts.length) {
      const curId = this.props.contacts[this.state.currentContactIndex].id
      const nextIndex = nextProps.contacts.findIndex((c) => c.id === curId)
      if (nextIndex != nextState.currentContactIndex) {
        nextState.currentContactIndex = nextIndex
      }
    }
    if (this.contactCount() === 0) {
      setTimeout(() => window.location.reload(), 5000)
    }
  }

  getContactData = async (newIndex, force = false) => {
    const { contacts } = this.props
    const BATCH_GET = 10 // how many to get at once
    const BATCH_FORWARD = 5 // when to reach out and get more
    let getIds = []
    // if we don't have current data, get that
    if (contacts[newIndex]
        && !this.state.contactCache[contacts[newIndex].id]) {
      getIds = contacts
        .slice(newIndex, newIndex + BATCH_GET)
        .map((c) => c.id)
        .filter((cId) => !force || !this.state.contactCache[cId])
    }
    // if we DO have current data, but don't have data base BATCH_FORWARD...
    if (!getIds.length
        && contacts[newIndex + BATCH_FORWARD]
        && !this.state.contactCache[contacts[newIndex + BATCH_FORWARD].id]) {
      getIds = contacts
        .slice(newIndex + BATCH_FORWARD, newIndex + BATCH_FORWARD + BATCH_GET)
        .map((c) => c.id)
        .filter((cId) => !force || !this.state.contactCache[cId])
    }

    if (getIds.length) {
      const contactData = await this.props.loadContacts(getIds)
      const { data: { getAssignmentContacts } } = contactData
      if (getAssignmentContacts) {
        const newContactData = {}
        getAssignmentContacts.forEach((c) => {
          newContactData[c.id] = c
        })
        this.setState({
          contactCache: { ...this.state.contactCache,
                          ...newContactData}})
      }
    }
  }

  getContact(contacts, index) {
    if (contacts.length > index) {
      return contacts[index]
    }
    return null
  }

  incrementCurrentContactIndex = (increment) => {
    let newIndex = this.state.currentContactIndex
    newIndex = newIndex + increment
    this.updateCurrentContactIndex(newIndex)
  }

  updateCurrentContactIndex(newIndex) {
    this.setState({
      currentContactIndex: newIndex
    })
    this.getContactData(newIndex)
  }

  hasPrevious() {
    return this.state.currentContactIndex > 0
  }

  hasNext() {
    return this.state.currentContactIndex < this.contactCount() - 1
  }

  handleFinishContact = () => {
    if (this.hasNext()) {
      this.handleNavigateNext()
    } else {
      // Will look async and then redirect to todo page if not
      this.props.assignContactsIfNeeded(/* checkServer*/true)
    }
  }

  handleNavigateNext = () => {
    if (!this.hasNext()) {
      return
    }

    //this.props.refreshData()
    this.setState({ direction: 'right' }, () => this.incrementCurrentContactIndex(1))
  }

  handleNavigatePrevious = () => {
    if (!this.hasPrevious()) {
      return
    }
    this.setState({ direction: 'left' }, () => this.incrementCurrentContactIndex(-1))
  }

  handleCannedResponseChange = (script) => {
    this.handleScriptChange(script)
    this.handleClosePopover()
  }

  handleScriptChange = (script) => {
    this.setState({ script })
  }

  handleExitTexter = () => {
    this.props.router.push('/app/' + (this.props.organizationId || ''))
  }

  contactCount() {
    const { contacts } = this.props
    return contacts.length
  }

  currentContact() {
    const { contacts } = this.props

    // If the index has got out of sync with the contacts available, then rewind to the start
    if (typeof this.state.currentContactIndex != 'undefined') {
      return this.getContact(contacts, this.state.currentContactIndex)
    } else {
      this.updateCurrentContactIndex(0)
      return this.getContact(contacts, 0)
    }
  }

  renderNavigationToolbarChildren() {
    const { allContactsCount } = this.props
    const remainingContacts = this.contactCount()
    const messagedContacts = allContactsCount - remainingContacts

    const currentIndex = this.state.currentContactIndex + 1 + messagedContacts
    let ofHowMany = allContactsCount
    if (ofHowMany === currentIndex
        && this.props.assignment.campaign.useDynamicAssignment) {
      ofHowMany = '?'
    }
    const title = `${currentIndex} of ${ofHowMany}`
    return [
      <ToolbarTitle
        className={css(styles.navigationToolbarTitle)}
        text={title}
      />,
      <IconButton
        onTouchTap={this.handleNavigatePrevious}
        disabled={!this.hasPrevious()}
      >
        <NavigateBeforeIcon />
        </IconButton>,
      <IconButton
        onTouchTap={this.handleNavigateNext}
        disabled={!this.hasNext()}
      >
        <NavigateNextIcon />
        </IconButton>
    ]
  }

  renderTexter() {
    const { assignment } = this.props
    const { campaign, texter } = assignment
    const contact = this.currentContact()
    const navigationToolbarChildren = this.renderNavigationToolbarChildren()
    const contactData = this.state.contactCache[contact.id]
    if (!contactData) {
      return null
    }
    return (
      <AssignmentTexterContact
        key={contact.id}
        assignment={assignment}
        campaignContactId={contact.id}
        contact={contactData}
        texter={texter}
        campaign={campaign}
        navigationToolbarChildren={navigationToolbarChildren}
        onFinishContact={this.handleFinishContact}
        refreshData={this.props.refreshData}
        onExitTexter={this.handleExitTexter}
      />
    )
  }
  renderEmpty() {
    return (
      <div>
        <Empty
          title="You've already messaged or replied to all your assigned contacts for now."
          icon={<Check />}
          content={(<RaisedButton
            label='Back To Todos'
            onClick={this.handleExitTexter}
          >
          </RaisedButton>)}
        >

        </Empty>
      </div>
    )
  }
  render() {
    const { contacts } = this.props.assignment
    return (
      <div className={css(styles.container)}>
        {contacts.length === 0 ? this.renderEmpty() : this.renderTexter()}
      </div>
    )
  }
}

AssignmentTexter.propTypes = {
  currentUser: PropTypes.object,
  assignment: PropTypes.object,      // current assignment
  contacts: PropTypes.array,   // contacts for current assignment
  allContactsCount: PropTypes.number,
  router: PropTypes.object,
  refreshData: PropTypes.func,
  loadContacts: PropTypes.func,
  organizationId: PropTypes.string
}

export default withRouter(AssignmentTexter)
