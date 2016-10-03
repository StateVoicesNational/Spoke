import React from 'react'
import { List, ListItem } from 'material-ui/List'
import moment from 'moment'
import WarningIcon from 'material-ui/svg-icons/alert/warning'
import HappyIcon from 'material-ui/svg-icons/social/mood'
import ArchiveIcon from 'material-ui/svg-icons/content/archive'
import IconButton from 'material-ui/IconButton'
import { withRouter } from 'react-router'
import theme from '../styles/theme'
import Chip from './Chip'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'

const inlineStyles = {
  past: {
    opacity: 0.6
  },
  warn: {
    color: theme.colors.orange
  },
  good: {
    color: theme.colors.green
  }
}

class CampaignList extends React.Component {
  renderRow(campaign) {
    const isPast = moment(campaign.dueBy).diff(moment()) < 0
    const { isStarted, hasUnassignedContacts } = campaign

    let listItemStyle = {}
    let leftIcon = ''
    if (!isStarted || hasUnassignedContacts) {
      listItemStyle = inlineStyles.warn
      leftIcon = <WarningIcon />
    } else if (isPast) {
      listItemStyle = inlineStyles.past
    } else {
      leftIcon = <HappyIcon />
      listItemStyle = inlineStyles.good
    }

    const dueByMoment = moment(campaign.dueBy)
    const tags = []
    if (!isStarted) {
      tags.push('Not started')
    }

    if (hasUnassignedContacts) {
      tags.push('Unassigned contacts')
    }

    const primaryText = (
      <div>
        {campaign.title}
        {tags.map((tag) => <Chip text={tag} />)}
      </div>
    )
    const secondaryText = (
      <span>
        <span>
          {campaign.description}
          <br />
          {dueByMoment.isValid() ?
           dueByMoment.format('MMM D, YYYY') :
           'No due date set'}
        </span>
      </span>
    )

    // rightIconButton={(
    // )}

    const campaignUrl = `/admin/${this.props.organizationId}/campaigns/${campaign.id}`
    return (
      <ListItem
        style={listItemStyle}
        key={campaign.id}
        primaryText={primaryText}
        onTouchTap={() => (!isStarted ?
          this.props.router.push(`${campaignUrl}/edit`) :
          this.props.router.push(campaignUrl))}
        secondaryText={secondaryText}
        leftIcon={leftIcon}
      >
        <AdminCampaignArchiveControl
          campaign={campaign}
          button={
            //   <IconButton
            //     onTouchTap={() => console.log("archive this!")}
            //     tooltip="Archive"
            //     tooltipPosition="top-left"
            //   >
            //     <ArchiveIcon/>
            //   </IconButton>

          }
        />
      </ListItem>
    )
  }

  render() {
    const { campaigns } = this.props
    return campaigns.length === 0 ? '' : (
      <List>
        {campaigns.map((campaign) => this.renderRow(campaign))}
      </List>
    )
  }
}

CampaignList.propTypes = {
  campaigns: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      dueBy: React.PropTypes.string,
      title: React.PropTypes.string,
      description: React.PropTypes.string
    })
  ),
  router: React.PropTypes.object,
  organizationId: React.PropTypes.string
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query adminGetCampaigns($organizationId: String!, $isActive: Boolean!) {
      organization(id: $organizationId) {
        id
        campaigns(isActive: $isActive) {
          id
          title
          isStarted
          hasUnassignedContacts
          description
          dueBy
        }
      }
    }`,
    variables: {
      organizationId: ownProps.organizationId,
      isActive: ownProps.campaignsFilter
    },
    forceFetch: true
  }
})

export default loadData(wrapMutations(
  withRouter(CampaignList)), {
    mapQueriesToProps,
    mapMutationsToProps
  })

