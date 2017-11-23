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
      currentContactIndex: 0
    })
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.contactCount() === 0) {
      setTimeout(() => window.location.reload(), 5000)
    }
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
      this.props.assignContactsIfNeeded(true)
    }
  }

  handleNavigateNext = () => {
    if (!this.hasNext()) {
      return
    }

    this.props.refreshData()
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
    if (this.getContact(contacts, this.state.currentContactIndex)) {
      return this.getContact(contacts, this.state.currentContactIndex)
    } else {
      this.updateCurrentContactIndex(0)
      return this.getContact(contacts, 0)
    }
  }

  renderNavigationToolbarChildren() {
    return ''
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
  currentUser: React.PropTypes.object,
  assignment: React.PropTypes.object,      // current assignment
  contacts: React.PropTypes.array,   // contacts for current assignment
  router: React.PropTypes.object,
  refreshData: React.PropTypes.func,
  organizationId: React.PropTypes.string
}

export default withRouter(AssignmentTexter)
