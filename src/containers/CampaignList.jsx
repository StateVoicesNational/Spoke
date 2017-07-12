import React from 'react'
import { List, ListItem } from 'material-ui/List'
import moment from 'moment'
import WarningIcon from 'material-ui/svg-icons/alert/warning'
import ArchiveIcon from 'material-ui/svg-icons/content/archive'
import UnarchiveIcon from 'material-ui/svg-icons/content/unarchive'
import IconButton from 'material-ui/IconButton'
import { withRouter } from 'react-router'
import theme from '../styles/theme'
import Chip from '../components/Chip'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import wrapMutations from './hoc/wrap-mutations'
import SpeakerNotesIcon from 'material-ui/svg-icons/action/speaker-notes'
import Empty from '../components/Empty'


const campaignInfoFragment = `
  id
  title
  isStarted
  isArchived
  hasUnassignedContacts
  description
  dueBy
`

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
    const { isStarted, isArchived, hasUnassignedContacts } = campaign

    let listItemStyle = {}
    let leftIcon = ''
    if (isArchived) {
      listItemStyle = inlineStyles.past
    } else if (!isStarted || hasUnassignedContacts) {
      listItemStyle = inlineStyles.warn
      leftIcon = <WarningIcon />
    } else {
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
        rightIconButton={campaign.isArchived ? (
          <IconButton
            tooltip='Unarchive'
            onTouchTap={async () => this.props.mutations.unarchiveCampaign(campaign.id)}
          >
            <UnarchiveIcon />
          </IconButton>
        ) : (
            <IconButton
              tooltip='Archive'
              onTouchTap={async () => this.props.mutations.archiveCampaign(campaign.id)}
            >
              <ArchiveIcon />
            </IconButton>
        )}
      />
    )
  }

  render() {
    const { campaigns } = this.props.data.organization
    return campaigns.length === 0 ? (
      <Empty
        title='No campaigns'
        icon={<SpeakerNotesIcon />}
      />
    ) : (
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

const mapMutationsToProps = () => ({
  archiveCampaign: (campaignId) => ({
    mutation: gql`mutation archiveCampaign($campaignId: String!) {
          archiveCampaign(id: $campaignId) {
            ${campaignInfoFragment}
          }
        }`,
    variables: { campaignId }
  }),
  unarchiveCampaign: (campaignId) => ({
    mutation: gql`mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  })
})

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query adminGetCampaigns($organizationId: String!, $campaignsFilter: CampaignsFilter) {
      organization(id: $organizationId) {
        id
        campaigns(campaignsFilter: $campaignsFilter) {
          ${campaignInfoFragment}
        }
      }
    }`,
    variables: {
      organizationId: ownProps.organizationId,
      campaignsFilter: ownProps.campaignsFilter
    },
    forceFetch: true
  }
})

export default loadData(wrapMutations(
  withRouter(CampaignList)), {
    mapQueriesToProps,
    mapMutationsToProps
  })

