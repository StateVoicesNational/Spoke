import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import {Card, CardActions, CardTitle, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton'
import { Campaigns } from '../../api/campaigns/campaigns'
import Badge from 'material-ui/Badge'
import {  ContactFilters } from '../../api/campaign_contacts/methods'
import { moment } from 'meteor/momentjs:moment'
import Divider from 'material-ui/Divider'
import Tooltip from 'material-ui/internal/Tooltip'
const styles = {
  badge: {
    top: 16,
    right: 16
  },
  root: {
    margin: '20px 0'
  }
}

export class AssignmentSummary extends Component {
  constructor(props) {
    super(props)
    this.state = { badTimezoneTooltipOpen: false }
  }

  renderBadgedButton({ assignment, title, count, primary, disabled, contactFilter, tooltip }) {
    const { organizationId } = this.props
    console.log(organizationId)
    const { badTimezoneTooltipOpen } = this.state
    return (count === 0 ? '' :
      <Badge
        badgeStyle={styles.badge}
        badgeContent={count}
        primary={primary}
        secondary={!primary}
      >
        <FlatButton
          disabled={disabled}
          label={title}
          onTouchTap={ () => contactFilter ? FlowRouter.go('textUnmessaged', { organizationId, contactFilter, assignmentId: assignment._id }) : null }
          onMouseEnter={tooltip ? ()=>{this.setState({badTimezoneTooltipOpen: true})} : null}
          onMouseLeave={tooltip ? ()=>{this.setState({badTimezoneTooltipOpen: false})} : null }
        />
         <Tooltip show={badTimezoneTooltipOpen}
          label={tooltip}
          horizontalPosition="right"
          verticalPosition="top"
          touch={true}
         />
      </Badge>
    )
  }

  render() {
    const { assignment, unmessagedCount, unrepliedCount, badTimezoneCount } = this.props
    const { title, description } = Campaigns.findOne(assignment.campaignId)

    const hasTextableContacts = unrepliedCount > 0 || unmessagedCount > 0
    const hasUntextableContacts = badTimezoneCount > 0

    const summary = (
      <Card style={styles.root}>
        <CardTitle title={title} subtitle={`${description} - ${moment(assignment.dueBy).format('MMM D YYYY')}`} />
        <Divider />
        <CardActions>
          { this.renderBadgedButton({
            assignment,
            title: 'Send first texts',
            count: unmessagedCount,
            primary: true,
            disabled: false,
            contactFilter: ContactFilters.UNMESSAGED
          })}
          { this.renderBadgedButton({
            assignment,
            title: 'Send replies',
            count: unrepliedCount,
            primary: false,
            disabled: false,
            contactFilter: ContactFilters.UNREPLIED
          })}
          { this.renderBadgedButton({
            assignment,
            title: 'Send later',
            count: badTimezoneCount,
            primary: false,
            disabled: true,
            contactFilter: null,
            tooltip: `It's outside texting hours for some contacts. Come back later!`
          })}
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


