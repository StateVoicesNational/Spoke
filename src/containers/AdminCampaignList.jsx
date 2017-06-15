import React from 'react'
import CampaignList from './CampaignList'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import loadData from './hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import theme from '../styles/theme'
import LoadingIndicator from '../components/LoadingIndicator'
import wrapMutations from './hoc/wrap-mutations'
import DropDownMenu from 'material-ui/DropDownMenu'
import { MenuItem } from 'material-ui/Menu'

class AdminCampaignList extends React.Component {
  state = {
    isCreating: false,
    campaignsFilter: {
      isArchived: false
    }
  }

  handleClickNewButton = async () => {
    const { organizationId } = this.props.params
    this.setState({ isCreating: true })
    // const newCampaign = await this.props.mutations.createCampaign({
    //   title: 'New Campaign',
    //   description: '',
    //   dueBy: null,
    //   organizationId,
    //   contacts: [],
    //   interactionSteps: [{
    //     script: ''
    //   }]
    // })
    debugger
    const newInvite = await this.props.mutations.createInvite({
      id: 'cats',
      is_valid: true,
      created_at: Date.now()
    })
    debugger
    if (newInvite.errors) {
      alert('There was an error creating your invite')
      throw new Error(newInvite.errors)
    }
    // if (newCampaign.errors) {
    //   alert('There was an error creating your campaign')
    //   throw new Error(newCampaign.errors)
    // }

    // this.props.router.push(
    //   `/admin/${organizationId}/campaigns/${newCampaign.data.createCampaign.id}/edit?new=true`
    // )
  }

  handleFilterChange = (event, index, value) => {
    this.setState({
      campaignsFilter: {
        isArchived: value
      }
    })
  }

  renderFilters() {
    return (
      <DropDownMenu value={this.state.campaignsFilter.isArchived} onChange={this.handleFilterChange}>
        <MenuItem value={false} primaryText="Current" />
        <MenuItem value={true} primaryText="Archived" />
      </DropDownMenu>
    )
  }
  render() {
    return (
      <div>
        { this.renderFilters()}
        { this.state.isCreating ? <LoadingIndicator /> : (
          <CampaignList
            campaignsFilter={this.state.campaignsFilter}
            organizationId={this.props.params.organizationId}
          />

        ) }

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

const mapMutationsToProps = () => ({
  // createCampaign: (campaign) => ({
  //   mutation: gql`
  //     mutation createBlankCampaign($campaign: CampaignInput!) {
  //       createCampaign(campaign: $campaign) {
  //         id
  //       }
  //     }
  //   `,
  //   variables: { campaign }
  // }),
  createInvite: (invite) => ({
      mutation: gql`
        mutation createInvite($invite: InviteInput!) {
          createInvite(invite: $invite) {
            id
          }
        }`,
      variables: { invite }
    })
})

export default loadData(wrapMutations(
  withRouter(AdminCampaignList)), {
    mapMutationsToProps
  })
