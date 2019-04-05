import PropTypes from 'prop-types'
import React from 'react'
import CampaignList from './CampaignList'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import ArchiveIcon from 'material-ui/svg-icons/content/archive'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import loadData from './hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import theme from '../styles/theme'
import LoadingIndicator from '../components/LoadingIndicator'
import wrapMutations from './hoc/wrap-mutations'
import DropDownMenu from 'material-ui/DropDownMenu'
import IconMenu from 'material-ui/IconMenu'
import { MenuItem } from 'material-ui/Menu'
import { dataTest } from '../lib/attributes'
import IconButton from 'material-ui/IconButton/IconButton'

class AdminCampaignList extends React.Component {
  state = {
    isLoading: false,
    campaignsFilter: {
      isArchived: false,
      listSize: 0
    },
    archiveMultiple: false,
    campaignsToArchive: {}
  }

  handleClickNewButton = async () => {
    const { organizationId } = this.props.params
    this.setState({ isLoading: true })
    const newCampaign = await this.props.mutations.createCampaign({
      title: 'New Campaign',
      description: '',
      dueBy: null,
      organizationId,
      contacts: [],
      interactionSteps: {
        script: ''
      }
    })
    if (newCampaign.errors) {
      alert('There was an error creating your campaign')
      throw new Error(newCampaign.errors)
    }

    this.props.router.push(
      `/admin/${organizationId}/campaigns/${newCampaign.data.createCampaign.id}/edit?new=true`
    )
  }

  handleClickArchiveButton = async (keys) => {
    if (keys.length) {
      this.setState({ isLoading: true })
      await this.props.mutations.archiveCampaigns(keys)
      this.setState({
        archiveMultiple: false,
        isLoading: false,
        campaignsToArchive: {}
      })
    }
  }

  handleFilterChange = (event, index, value) => {
    this.setState({
      campaignsFilter: {
        isArchived: value,
        listSize: this.state.campaignsFilter.listSize
      }
    })
  }

  handleListSizeChange = (event, index, value) => {
    this.setState({
      campaignsFilter: {
        isArchived: this.state.campaignsFilter.isArchived,
        listSize: value
      }
    })
  }

  handleChecked = ({ campaignId, checked }) => {
    this.setState(prevState => {
      const { campaignsToArchive } = prevState
      // checked has to be reversed here because the onTouchTap
      // event fires before the input is checked.
      if (!checked) {
        campaignsToArchive[campaignId] = !checked
      } else {
        delete campaignsToArchive[campaignId]
      }
      return { campaignsToArchive }
    })
  }

  toggleStateWithDelay = (property, delay) => {
    setTimeout(() => {
      this.setState(prevState => ({ [property]: !prevState[property] }))
    }, delay)
  }

  renderListSizeOptions() {
    return (
      <DropDownMenu value={this.state.campaignsFilter.listSize} onChange={this.handleListSizeChange} >
        <MenuItem value={10} primaryText='10' />
        <MenuItem value={25} primaryText='25' />
        <MenuItem value={50} primaryText='50' />
        <MenuItem value={100} primaryText='100' />
        <MenuItem value={0} primaryText='All' />
      </DropDownMenu>
    )
  }

  renderFilters() {
    return (
      <DropDownMenu value={this.state.campaignsFilter.isArchived} onChange={this.handleFilterChange}>
        <MenuItem value={false} primaryText='Current' />
        <MenuItem value primaryText='Archived' />
      </DropDownMenu>
    )
  }

  renderArchiveMultiple() {
    return (
      <IconMenu
        iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
        style={{ bottom: '13px' }}
      >
        {/*
          The IconMenu component delays hiding the menu after it is
          clicked for 200ms. This looks nice, so the state change is
          delayed for 201ms to avoid switching the menu text before the
          menu is hidden.
        */}
        {this.state.archiveMultiple ?
          <MenuItem
            primaryText='Cancel'
            onClick={() => { this.toggleStateWithDelay('archiveMultiple', 250) }}
          />
          :
          <MenuItem
            primaryText='Archive multiple campaigns'
            onClick={() => { this.toggleStateWithDelay('archiveMultiple', 250) }}
          />
        }

      </IconMenu>
    )
  }

  renderActionButton() {
    if (this.state.archiveMultiple) {
      const keys = Object.keys(this.state.campaignsToArchive)
      return (
        <FloatingActionButton
          {...dataTest('archiveCampaigns')}
          style={theme.components.floatingButton}
          onTouchTap={() => this.handleClickArchiveButton(keys)}
          disabled={!keys.length}
        >
          <ArchiveIcon />
        </FloatingActionButton>
      )
    }
    return (
      <FloatingActionButton
        {...dataTest('addCampaign')}
        style={theme.components.floatingButton}
        onTouchTap={this.handleClickNewButton}
      >
        <ContentAdd />
      </FloatingActionButton>
    )
  }

  render() {
    const { adminPerms } = this.props.params
    return (
      <div>
        {adminPerms && this.renderArchiveMultiple()}
        {!this.state.archiveMultiple && this.renderFilters()}
        {this.renderListSizeOptions()}
        {this.state.isLoading ? <LoadingIndicator /> : (
          <CampaignList
            campaignsFilter={this.state.campaignsFilter}
            organizationId={this.props.params.organizationId}
            adminPerms={adminPerms}
            selectMultiple={this.state.archiveMultiple}
            handleChecked={this.handleChecked}
          />
        )}

        {adminPerms && this.renderActionButton()}
      </div>
    )
  }
}

AdminCampaignList.propTypes = {
  params: PropTypes.object,
  mutations: PropTypes.exact({
    createCampaign: PropTypes.func,
    archiveCampaigns: PropTypes.func
  }),
  router: PropTypes.object
}

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
  }),
  archiveCampaigns: ids => ({
    mutation: gql`
      mutation archiveCampaigns($ids: [String!]) {
        archiveCampaigns(ids: $ids) {
          id
        }
      }
    `,
    variables: { ids }
  })
})

export default loadData(wrapMutations(
  withRouter(AdminCampaignList)), {
    mapMutationsToProps
  })
