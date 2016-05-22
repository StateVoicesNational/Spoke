import React, { Component } from 'react'
import { AssignmentTexter } from './assignment_texter'
import Paper from 'material-ui/Paper'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton'
import Badge from 'material-ui/Badge';
import Dialog from 'material-ui/Dialog';

const styles = {
  dialog: {
    width: '100%',
    maxWidth: 'none',
    top: -80,
    padding: 0
  },
  dialogBody: {
    padding: 0,
  },
  dialogContent: {
    // Purely to get the dialog to be fullscreen
    height: '2000px',
  },
  badge: {
    top: 16,
    right: 16
  }
}
export class AssignmentSummary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currentTextingContacts: []
    }
  }

  handleStopTexting() {
    this.setState({currentTextingContacts: []})
  }

  renderBadgedButton(title, currentTextingContacts, isPrimary) {
    const count = currentTextingContacts.length
    return (count === 0 ? '' :
      <Badge
        badgeStyle={styles.badge}
        badgeContent={count}
        primary={isPrimary}
        secondary={!isPrimary}
      >
        <FlatButton
          label={title}
          onTouchTap={() => this.setState({currentTextingContacts})}
        />
      </Badge>
    )

  }

  render() {
    const { assignment, contacts } = this.props
    const { currentTextingContacts } = this.state

    const unmessagedContacts = contacts.filter((contact) => !contact.lastMessage())
    const unrespondedContacts = contacts.filter((contact) => {
      const lastMessage = contact.lastMessage()
      return (!!lastMessage && lastMessage.isFromContact)
    })

    const firstMessageCount = unmessagedContacts.length
    const replyCount = unrespondedContacts.length

    console.log(firstMessageCount, replyCount)
    const summary = (
      <Card>
        <CardTitle title={assignment.campaign().title} subtitle={assignment.campaign().description} />
        <CardText>
          { (replyCount > 0 || firstMessageCount > 0) ? "Start messaging!" : "Looks like you're done for now. Nice work!"}
        </CardText>

        <CardActions>
          { this.renderBadgedButton('Send first texts', unmessagedContacts, true)}
          { this.renderBadgedButton('Send replies', unrespondedContacts, false)}
        </CardActions>
      </Card>
    )
    const actions = []
    return (
      <Paper>
        {summary}
        <Dialog
          actions={actions}
          modal = {true}
          bodyStyle={styles.dialogBody}
          autoDetectWindowHeight={false}
          autoScrollBodyContent={false}
          contentStyle={styles.dialog}
          open={currentTextingContacts.length > 0}
        >
        <div style={styles.dialogContent}>
          <AssignmentTexter
            assignment={assignment}
            contacts={currentTextingContacts}
            handleStopTexting={this.handleStopTexting.bind(this)}
          />
        </div>
        </Dialog>

      </Paper>
    )
  }
}

AssignmentSummary.propTypes = {
  assignment: React.PropTypes.object,      // current assignment
  contacts: React.PropTypes.array   // contacts for current assignment
}


