import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton'
import Badge from 'material-ui/Badge';

const styles = {
  badge: {
    top: 16,
    right: 16
  }
}
export class AssignmentSummary extends Component {
  startTexting() {
    console.log("hello odongo")
    const { handleStartTexting, contacts } = this.props

    handleStartTexting(contacts)
  }
  renderBadgedButton(title, currentTextingContacts, isPrimary) {
    const count = currentTextingContacts.length
    const { onStartTexting } = this.props

    return (count === 0 ? '' :
      <Badge
        badgeStyle={styles.badge}
        badgeContent={count}
        primary={isPrimary}
        secondary={!isPrimary}
      >
        <FlatButton
          label={title}
          onTouchTap={ () => onStartTexting(currentTextingContacts) }
        />
      </Badge>
    )
  }

  render() {
    const { assignment, contacts } = this.props

    const unmessagedContacts = contacts.filter((contact) => !contact.lastMessage())
    const unrespondedContacts = contacts.filter((contact) => {
      const lastMessage = contact.lastMessage()
      return (!!lastMessage && lastMessage.isFromContact)
    })

    const firstMessageCount = unmessagedContacts.length
    const replyCount = unrespondedContacts.length

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
    return (
      <Paper>
        {summary}
      </Paper>
    )
  }
}

AssignmentSummary.propTypes = {
  assignment: React.PropTypes.object,      // current assignment
  contacts: React.PropTypes.array, // contacts for current assignment
  handleStartTexting: React.PropTypes.func
}


