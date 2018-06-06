import PropTypes from 'prop-types'
import React from 'react'
import CampaignList from './CampaignList'
import Button from '@material-ui/core/Button'
import AddIcon from '@material-ui/icons/Add'
import loadData from './hoc/load-data'
import { hasRole } from '../lib'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import theme from '../styles/theme'
import LoadingIndicator from '../components/LoadingIndicator'
import wrapMutations from './hoc/wrap-mutations'
// TODO: material-ui
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from '@material-ui/core/MenuItem'
import { dataTest } from '../lib/attributes'

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
        <MenuItem>Current</MenuItem>
        <MenuItem selected>Archived</MenuItem>
      </DropDownMenu>
    )
  }
  render() {
    const { adminPerms } = this.props.params
    return (
      <div>
        {this.renderFilters()}
        {this.state.isCreating ? <LoadingIndicator /> : (
          <CampaignList
            campaignsFilter={this.state.campaignsFilter}
            organizationId={this.props.params.organizationId}
            adminPerms={adminPerms}
          />
        )}

        {adminPerms ?
         (<Button
           {...dataTest('addCampaign')}
           variant='fab'
           style={theme.components.floatingButton}
           onClick={this.handleClickNewButton}
         >
           <AddIcon />
         </Button>
         ) : null}
      </div>
    )
  }
}

AdminCampaignList.propTypes = {
  params: PropTypes.object,
  mutations: PropTypes.object,
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
  })
})

export default loadData(wrapMutations(
  withRouter(AdminCampaignList)), {
    mapMutationsToProps
  })
