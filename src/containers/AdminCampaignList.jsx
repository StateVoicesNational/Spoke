import React from 'react'
import CampaignList from '../components/CampaignList'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import moment from 'moment'
import Subheader from 'material-ui/Subheader'
import SpeakerNotesIcon from 'material-ui/svg-icons/action/speaker-notes'
import Empty from '../components/Empty'
import loadData from './hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import _ from 'lodash'
import theme from '../styles/theme'
import LoadingIndicator from '../components/LoadingIndicator'
import wrapMutations from './hoc/wrap-mutations'

class AdminCampaignList extends React.Component {
  state = {
    isCreating: false
  }

  handleClickNewButton = async () => {
    const { organizationId } = this.props.params
    this.setState({ isCreating: true })
    const newCampaign = await this.props.mutations.createCampaign({
      title: 'New Campaign',
      description: '',
      dueBy: null,
      organizationId,
      contacts: {
        data: [],
        checksum: ''
      },
      interactionSteps: [{
        script: ''
      }]
    })
    if (newCampaign.errors) {
      alert('There was an error creating your campaign')
      throw new Error(newCampaign.errors)
    }

    this.props.router.push(
      `/admin/${organizationId}/campaigns/${newCampaign.data.createCampaign.id}/edit?new=true`
    )
  }

  renderEmpty() {
    return (
      <Empty
        title='No campaigns yet'
        icon={<SpeakerNotesIcon />}
      />
    )
  }

  renderList(campaigns) {
    const groupedCampaigns = _.groupBy(
      campaigns, (campaign) => moment(campaign.dueBy).diff(moment()) < 0
    )
    if (this.state.isCreating) {
      return <LoadingIndicator />
    }

    return (
      <div>
        {
          [false, true].map((isPast) => (
            groupedCampaigns[isPast] ? (
              <div>
                <Subheader>{isPast ? 'Past' : 'Current'}</Subheader>
                <CampaignList
                  campaigns={groupedCampaigns[isPast]}
                  organizationId={this.props.params.organizationId}
                />
              </div>
            ) : (
              ''
            )

          ))
        }
      </div>
    )
  }

  render() {
    const { campaigns } = this.props.data.organization

    return (
      <div>
        {campaigns.length > 0 ? this.renderList(campaigns) : this.renderEmpty()}
        <FloatingActionButton
          style={theme.components.floatingButton}
          onTouchTap={this.handleClickNewButton}
        >
          <ContentAdd />
        </FloatingActionButton>
      </div>
    )
  }
}

AdminCampaignList.propTypes = {
  data: React.PropTypes.object,
  params: React.PropTypes.object,
  mutations: React.PropTypes.object,
  router: React.PropTypes.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query adminGetCampaigns($organizationId: String!) {
      organization(id: $organizationId) {
        id
        campaigns {
          id
          title
          isStarted
          description
          dueBy
          assignments {
            id
          }
        }
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
})

const mapMutationsToProps = () => ({
  createCampaign: (campaign) => ({
    mutation: gql`
      mutation createBlankCampaign($campaign: CampaignInput!) {
        createCampaign(campaign: $campaign) {
          id
        }
      }
    `,
    variables: { campaign }
  })
})

export default loadData(wrapMutations(
  withRouter(AdminCampaignList)), {
    mapQueriesToProps,
    mapMutationsToProps
  })
