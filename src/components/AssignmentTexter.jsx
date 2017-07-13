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
import FlatButton from 'material-ui/FlatButton'
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
      currentContactIndex: 0,
      direction: 'right'
    }
  }

  getContact(contacts, index) {
    return (contacts.length > index) ? contacts[index] : null
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
      this.handleExitTexter()
    }
  }

  handleNavigateNext = () => {
    if (!this.hasNext()) {
      return
    }

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
    this.props.router.push('/app')
  }

  contactCount() {
    const { contacts } = this.props
    return contacts.length
  }

  currentContact() {
    const { contacts } = this.props
    return this.getContact(contacts, this.state.currentContactIndex)
  }

  renderNavigationToolbarChildren() {
    const title = `${this.state.currentContactIndex + 1} of ${this.contactCount()}`
    return [
      <ToolbarTitle
        className={css(styles.navigationToolbarTitle)}
        text={title}
      />,
      <IconButton
        onTouchTap={this.handleNavigatePrevious}
        disabled={!this.hasPrevious()}
        // style={styles.toolbarIconButton}
      >
        <NavigateBeforeIcon />
      </IconButton>,
      <IconButton
        onTouchTap={this.handleNavigateNext}
        disabled={!this.hasNext()}
        // style={styles.toolbarIconButton}
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
    return (
      <AssignmentTexterContact
        key={contact.id}
        assignment={assignment}
        campaignContactId={contact.id}
        texter={texter}
        campaign={campaign}
        navigationToolbarChildren={navigationToolbarChildren}
        onFinishContact={this.handleFinishContact}
        onRefreshAssignmentContacts={this.props.onRefreshAssignmentContacts}
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
        >
          <FlatButton
            label='Go back to todos'
          >
            primary
          </FlatButton>
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
  currentUser: React.PropTypes.object,
  assignment: React.PropTypes.object,      // current assignment
  contacts: React.PropTypes.array,   // contacts for current assignment
  router: React.PropTypes.object,
  onRefreshAssignmentContacts: React.PropTypes.func
}

export default withRouter(AssignmentTexter)
