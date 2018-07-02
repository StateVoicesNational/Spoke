import PropTypes from 'prop-types'
import React from 'react'
import { List, ListItem } from 'material-ui/List'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import moment from 'moment'
import ProhibitedIcon from 'material-ui/svg-icons/av/not-interested'
import Divider from 'material-ui/Divider'
import { red300 } from 'material-ui/styles/colors'
import Linkify from 'react-linkify'
import { extractHostname } from '../../src/lib'

const styles = {
  optOut: {
    fontSize: '13px',
    fontStyle: 'italic'
  },
  sent: {
    fontSize: '13px',
    textAlign: 'right',
    marginLeft: '24px',
    whiteSpace: 'pre-wrap'
  },
  received: {
    fontSize: '13px',
    marginRight: '24px',
    whiteSpace: 'pre-wrap'
  }
}

class MessageList extends React.Component {

  state = {
    activeLink: null
  }

  constructor(props) {
    super(props)

    this.handleOpenLink = this.handleOpenLink.bind(this)
    this.handleCloseLink = this.handleCloseLink.bind(this)
    this.componentDecorator = this.componentDecorator.bind(this)
  }

  handleOpenLink = (event) => {
    event.preventDefault()
    const href = event.currentTarget.href
    this.setState({ activeLink: href })
  }

  handleCloseLink = () => {
    this.setState({ activeLink: null })
  }

  componentDecorator(decoratedHref, decoratedText, key) {
    return (
      <span key={key}>
        [Link:
        <a href={decoratedHref} onClick={this.handleOpenLink}>
          {decoratedText}
        </a>]
      </span>
    )
  }

  render() {
    const { contact } = this.props
    const { optOut, messages } = contact

    const optOutItem = optOut ? (
      <div>
        <Divider />
        <ListItem
          style={styles.optOut}
          leftIcon={<ProhibitedIcon style={{ fill: red300 }} />}
          disabled
          primaryText={`${contact.firstName} opted out of texts`}
          secondaryText={moment(optOut.createdAt).fromNow()}
        />
      </div>
    ) : ''

    const linkActions = [
      <FlatButton
        label='Cancel'
        primary
        onClick={this.handleCloseLink}
      />,
      <FlatButton
        href={this.state.activeLink || ''}
        target='_blank'
        label='Open Link'
        secondary
      />
    ]

    return (
      <div>
        <List>
          {messages.map(message => (
            <ListItem
              disabled
              style={message.isFromContact ? styles.received : styles.sent}
              key={message.id}
              primaryText={message.isFromContact ? (
                <Linkify
                  textDecorator={href => extractHostname(href)}
                  componentDecorator={this.componentDecorator}
                >
                  {message.text}
                </Linkify>
              ) : <Linkify>{message.text}</Linkify>}
              secondaryText={moment(message.createdAt).fromNow()}
            />
          ))}
          {optOutItem}
        </List>
        <Dialog
          title='Warning: External Link'
          actions={linkActions}
          modal
          open={this.state.activeLink !== null}
        >
          You have clicked an external link sent by the contact, {contact.firstName}. Please check the URL below and open <b>AT YOUR OWN RISK</b>.
          <br /><br />
          {this.state.activeLink}
        </Dialog>
      </div>
    )
  }
}

MessageList.propTypes = {
  contact: PropTypes.object
}

export default MessageList
