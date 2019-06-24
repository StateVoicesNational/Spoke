import gql from 'graphql-tag'
import SpeakerNotesIcon from 'material-ui/svg-icons/action/speaker-notes'
import PropTypes from 'prop-types'
import React from 'react'
import { List, ListItem } from 'material-ui/List'
import moment from 'moment'
import WarningIcon from 'material-ui/svg-icons/alert/warning'
import ArchiveIcon from 'material-ui/svg-icons/content/archive'
import UnarchiveIcon from 'material-ui/svg-icons/content/unarchive'
import IconButton from 'material-ui/IconButton'
import Checkbox from 'material-ui/Checkbox'
import { withRouter } from 'react-router'
import theme from '../styles/theme'
import Chip from '../components/Chip'
import loadData from './hoc/load-data'
import wrapMutations from './hoc/wrap-mutations'
import Empty from '../components/Empty'
import { dataTest } from '../lib/attributes'

const campaignInfoFragment = `
  id
  title
  isStarted
  isArchived
  hasUnassignedContacts
  hasUnsentInitialMessages
  description
  dueBy
  creator {
    displayName
  }
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
  },
  warnUnsent: {
    color: theme.colors.blue
  }
}

export class CampaignList extends React.Component {

  renderRightIcon({ isArchived }) {
    if (isArchived) {
      return (
        <IconButton
          tooltip='Unarchive'
          onTouchTap={async () => this.props.mutations.unarchiveCampaign(campaign.id)}
        >
          <UnarchiveIcon />
        </IconButton>)
    }
    return (
      <IconButton
        tooltip='Archive'
        onTouchTap={async () => this.props.mutations.archiveCampaign(campaign.id)}
      >
        <ArchiveIcon />
      </IconButton>)
  }

  renderRow(campaign) {
    const {
      isStarted,
      isArchived,
      hasUnassignedContacts,
      hasUnsentInitialMessages
    } = campaign
    const { adminPerms, selectMultiple } = this.props

    let listItemStyle = {}
    let leftIcon = ''
    if (isArchived) {
      listItemStyle = inlineStyles.past
    } else if (!isStarted || hasUnassignedContacts) {
      listItemStyle = inlineStyles.warn
      leftIcon = <WarningIcon />
    } else if (hasUnsentInitialMessages) {
      listItemStyle = inlineStyles.warnUnsent
    } else {
      listItemStyle = inlineStyles.good
    }

    const dueByMoment = moment(campaign.dueBy)
    const creatorName = campaign.creator ? campaign.creator.displayName : null
    const tags = []
    if (!isStarted) {
      tags.push('Not started')
    }

    if (hasUnassignedContacts) {
      tags.push('Unassigned contacts')
    }

    if (isStarted && hasUnsentInitialMessages) {
      tags.push('Unsent initial messages')
    }

    const primaryText = (
      <div>
        {campaign.title}
        {tags.map((tag) => <Chip key={tag} text={tag} />)}
      </div>
    )
    const secondaryText = (
      <span>
        <span>
          Campaign ID: {campaign.id}
          <br />
          {campaign.description}
          {creatorName ?
              (<span> &mdash; Created by {creatorName}</span>) : null}
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
        {...dataTest('campaignRow')}
        style={listItemStyle}
        key={campaign.id}
        primaryText={primaryText}
        onTouchTap={({
          currentTarget: { firstElementChild: { firstElementChild: { checked } } }
        }) => {
          if (selectMultiple) {
            this.props.handleChecked({ campaignId: campaign.id, checked })
          } else {
            return !isStarted ?
              this.props.router.push(`${campaignUrl}/edit`) :
              this.props.router.push(campaignUrl)
          }
        }
        }
        secondaryText={secondaryText}
        leftIcon={!selectMultiple ? leftIcon : null}
        rightIconButton={(!selectMultiple && adminPerms) ? this.renderRightIcon({ isArchived }) : null}
        leftCheckbox={selectMultiple ? <Checkbox /> : null}
      >
      </ListItem>
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
          {campaigns.campaigns.map((campaign) => this.renderRow(campaign))}
        </List>
      )
  }
}

CampaignList.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      dueBy: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string
    })
  ),
  router: PropTypes.object,
  adminPerms: PropTypes.bool,
  selectMultiple: PropTypes.bool,
  organizationId: PropTypes.string,
  data: PropTypes.object,
  mutations: PropTypes.object,
  handleChecked: PropTypes.func
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
          ... on CampaignsList{
            campaigns{
              ${campaignInfoFragment}
            }
          }
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
