import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton'
import Badge from 'material-ui/Badge';
import { getContactsToText, ContactFilters } from '../../api/campaign_contacts/methods'
const styles = {
  badge: {
    top: 16,
    right: 16
  }
}

export class AssignmentSummary extends Component {
  constructor(props) {
    super(props)
    this.getContactsToText = this.getContactsToText.bind(this)
  }
  startTexting() {
    const { handleStartTexting, contacts } = this.props

    handleStartTexting(contacts)
  }

  renderBadgedButton(assignment, title, count, isPrimary) {
    return (count === 0 ? '' :
      <Badge
        badgeStyle={styles.badge}
        badgeContent={count}
        primary={isPrimary}
        secondary={!isPrimary}
      >
        <FlatButton
          label={title}
          onTouchTap={ () => this.getContactsToText(assignment, ContactFilters.UNMESSAGED) }
        />
      </Badge>
    )
  }

  getContactsToText(assignment, contactFilter) {
    getContactsToText.call({assignmentId: assignment._id, contactFilter}, (err, contacts) => {
      const { onStartTexting } = this.props
      onStartTexting(assignment, contacts)
    })
  }

  render() {
    const { assignment, unmessagedCount, unrepliedCount } = this.props
    // FIXME
    // const { title, description } = assignment.campaign()

    const title = 'hi'
    const description = 'bype'
    const summary = (
      <Card style={styles.root}>
        <CardTitle title={title} subtitle={description} />
        { (unrepliedCount > 0 || unmessagedCount > 0) ? '' : <CardText>Looks like you're done for now. Nice work!</CardText>}

        <CardActions>
          { this.renderBadgedButton(assignment, 'Send first texts', unmessagedCount, true)}
          { this.renderBadgedButton(assignment, 'Send replies', unrepliedCount, false)}
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


