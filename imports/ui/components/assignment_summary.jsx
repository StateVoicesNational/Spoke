import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import {Card, CardActions, CardTitle, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton'
import { Campaigns } from '../../api/campaigns/campaigns'
import Badge from 'material-ui/Badge'
import { getContactsToText, ContactFilters } from '../../api/campaign_contacts/methods'
import { moment } from 'meteor/momentjs:moment'

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
    const { organizationId } = this.props
    return (count === 0 ? '' :
      <Badge
        badgeStyle={styles.badge}
        badgeContent={count}
        primary={isPrimary}
        secondary={!isPrimary}
      >
        <FlatButton
          label={title}
          onTouchTap={ () => FlowRouter.go('textUnmessaged', { organizationId, contactFilter: ContactFilters.UNMESSAGED, assignmentId: assignment._id }) }
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
    console.log("campaigns", assignment.campaignId)
    console.log(Campaigns.findOne(assignment.campaignId))
    const { title, description } = Campaigns.findOne(assignment.campaignId)

    const summary = (
      <Card style={styles.root}>
        <CardTitle title={title} subtitle=`${description} - ${moment(assignment.dueBy).format('MMM D')}` />
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
  organizationId: React.PropTypes.string,
  assignment: React.PropTypes.object,      // current assignment
  contacts: React.PropTypes.array, // contacts for current assignment
  handleStartTexting: React.PropTypes.func
}


