import React from 'react'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import { ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import IconButton from 'material-ui/IconButton/IconButton'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'
import AssignmentTexterContact from '../containers/AssignmentTexterContact'
// import { sendMessage } from '../../api/messages/methods'
// import { updateAnswers } from '../../api/survey_answers/methods'
import { StyleSheet, css } from 'aphrodite'
import transitions from '../styles/transitions'
import { withRouter } from 'react-router'

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

  hasPrevious() {
    return this.state.currentContactIndex > 0
  }

  hasNext() {
    return this.state.currentContactIndex < this.contactCount() - 1
  }

  handleExitTexter = () => {
    this.props.router.push('/app')
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

    console.log('trying to navigate next', this.state.currentContactIndex)

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

  getContact(contacts, index) {
    return (contacts.length > index) ? contacts[index] : null
  }

  contactCount() {
    const { contacts, assignment } = this.props
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
      <IconButton onTouchTap={this.handleNavigatePrevious}
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
    const cssClassName = (className) => {
      const base = this.state.direction === 'right' ? 'slideRight' : 'slideLeft'
      return css(transitions[`${base}${className}`])
    }
    const navigationToolbarChildren = this.renderNavigationToolbarChildren()
    return (
      <div className={css(styles.container)}>
        <ReactCSSTransitionGroup
          transitionName={{
            enter: cssClassName('Enter'),
            enterActive: cssClassName('EnterActive'),
            leave: cssClassName('Leave'),
            leaveActive: cssClassName('LeaveActive'),
            appear: cssClassName('Appear'),
            appearActive: cssClassName('AppearActive')
          }}
          transitionEnterTimeout={300}
          transitionLeaveTimeout={300}
        >
          <AssignmentTexterContact
            key={contact.id}
            assignment={assignment}
            campaignContactId={contact.id}
            texter={texter}
            campaign={campaign}
            navigationToolbarChildren={navigationToolbarChildren}
            onFinishContact={this.handleFinishContact}
            onExitTexter={this.handleExitTexter}
          />
        </ReactCSSTransitionGroup>
      </div>
    )
  }
  renderEmpty() {
    return (
      <div>
        No contacts!
      </div>
    )
  }
  render() {
    const { contacts } = this.props.assignment

    return contacts.length === 0 ? this.renderEmpty() : this.renderTexter()
  }
}

AssignmentTexter.propTypes = {
  currentUser: React.PropTypes.object,
  assignment: React.PropTypes.object,      // current assignment
  contacts: React.PropTypes.array   // contacts for current assignment
}

export default withRouter(AssignmentTexter)

