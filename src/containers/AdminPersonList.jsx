import PropTypes from 'prop-types'
import React from 'react'
import { Link, withRouter } from 'react-router'
import Empty from '../components/Empty'
import OrganizationJoinLink from '../components/OrganizationJoinLink'
import UserEdit from './UserEdit'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import DropDownMenu from 'material-ui/DropDownMenu'
import TextField from 'material-ui/TextField'
import MenuItem from 'material-ui/MenuItem'
import ContentAdd from 'material-ui/svg-icons/content/add'
import { Table, TableBody, TableRow, TableRowColumn } from 'material-ui/Table'
import Dialog from 'material-ui/Dialog'
import PeopleIcon from 'material-ui/svg-icons/social/people'
import { getHighestRole, ROLE_HIERARCHY } from '../lib'
import theme from '../styles/theme'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import { dataTest } from '../lib/attributes'
import LoadingIndicator from '../components/LoadingIndicator'
import { StyleSheet, css } from 'aphrodite'
import { Toolbar, ToolbarGroup } from 'material-ui'

const styles = StyleSheet.create({
  toolbar: {
    background: '#fff'
  },
  goButton: {
    marginLeft: 15,
    marginRight: 5
  },
  clearButton: {
    marginLeft: 5,
    marginRight: 5
  }
})

const organizationFragment = `
  id
  people(campaignId: $campaignId) {
    id
    displayName
    email
    roles(organizationId: $organizationId)
    todos(organizationId: $organizationId) {
      campaign {
        id
        title
      }
    }
  }
`
class AdminPersonList extends React.Component {
  constructor(props) {
    super(props)
    this.handleOpen = this.handleOpen.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.updateUser = this.updateUser.bind(this)
  }

  state = {
    open: false,
    userEdit: false,
    searchInput: '',
    activeSearch: null
  }

  handleFilterChange = (event, index, value) => {
    const query = value ? `?campaignId=${value}` : ''
    this.props.router.push(
      `/admin/${this.props.params.organizationId}/people${query}`
    )
  }

  handleOpen() {
    this.setState({ open: true })
  }

  handleClose() {
    this.setState({ open: false })
  }

  handleChange = async (userId, value) => {
    await this
      .props
      .mutations
      .editOrganizationRoles(this.props.params.organizationId, userId, [value])
  }

  editUser(userId) {
    this.setState({ userEdit: userId })
  }

  updateUser() {
    this.setState({ userEdit: false })
    this.props.personData.refetch()
  }

  renderCampaignsForPerson = person => (
    Boolean(person.todos.length) && (
      <ul>
        <li>
          {person.todos.map(t => (
            <Link key={t.id} to={`/admin/${this.props.params.organizationId}/campaigns/${t.campaign.id}`}>
              {t.campaign.title}
            </Link>
          ))}
        </li>
      </ul>
    )
  )

  renderCampaignDropdown = () => {
    const { organizationData: { organization } } = this.props
    const campaigns = organization ? organization.campaigns : []
    return (
      <ToolbarGroup firstChild>
        <DropDownMenu
          value={this.props.location.query.campaignId}
          onChange={this.handleFilterChange}
        >
          <MenuItem primaryText='All Campaigns' />
          {campaigns.map(campaign => (
            <MenuItem
              value={campaign.id}
              primaryText={campaign.title}
              key={campaign.id}
            />
          ))}
        </DropDownMenu>
      </ToolbarGroup>
    )
  }

  renderSearch = () => (
    <ToolbarGroup lastChild>
      <TextField
        name='search'
        placeholder='Search'
        value={this.state.searchInput}
        onChange={e => this.setState({ searchInput: e.target.value })}
      />
      <RaisedButton
        label='Go'
        primary
        className={css(styles.goButton)}
        onTouchTap={() => this.setState({ activeSearch: this.state.searchInput })}
      />
      <FlatButton
        label='Clear'
        className={css(styles.clearButton)}
        onTouchTap={() => this.setState({ searchInput: '', activeSearch: null })}
      />
    </ToolbarGroup>
  )

  renderTexters() {
    const { personData, userData: { currentUser } } = this.props
    if (!currentUser) return <LoadingIndicator />

    let people = personData.organization && personData.organization.people || []

    // Filter people by the search query
    if (this.state.activeSearch) {
      people = people.filter(
        person =>
          person.displayName.indexOf(this.state.activeSearch) !== -1 ||
          person.email.indexOf(this.state.activeSearch) !== -1
      )
    }

    if (people.length === 0) {
      return (
        <Empty
          title='No people yet'
          icon={<PeopleIcon />}
        />
      )
    }

    return (
      <Table selectable={false}>
        <TableBody
          displayRowCheckbox={false}
          showRowHover
        >
          {people.map((person) => (
            <TableRow
              key={person.id}
            >
              <TableRowColumn>
                {person.displayName}<br />
                {this.renderCampaignsForPerson(person)}
              </TableRowColumn>
              <TableRowColumn>{person.email}</TableRowColumn>
              <TableRowColumn>
                <DropDownMenu
                  value={getHighestRole(person.roles)}
                  disabled={person.id === currentUser.id || getHighestRole(person.roles) === 'OWNER' && getHighestRole(currentUser.roles) !== 'OWNER'}
                  onChange={(event, index, value) => this.handleChange(person.id, value)}
                >
                  {ROLE_HIERARCHY.map((option) => (
                    <MenuItem
                      key={person.id + '_' + option}
                      value={option}
                      disabled={option === 'OWNER' && getHighestRole(currentUser.roles) !== 'OWNER'}
                      primaryText={`${option.charAt(0).toUpperCase()}${option.substring(1).toLowerCase()}`}
                    />
                  ))}
                </DropDownMenu>
                <FlatButton
                  {...dataTest('editPerson')}
                  label='Edit'
                  onTouchTap={() => { this.editUser(person.id) }}
                />
              </TableRowColumn>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  render() {
    const { organizationData } = this.props

    return (
      <div>
        <Toolbar className={css(styles.toolbar)}>
        {this.renderCampaignDropdown()}
          {this.renderSearch()}
        </Toolbar>
        {this.renderTexters()}
        <FloatingActionButton
          {...dataTest('addPerson')}
          style={theme.components.floatingButton}
          onTouchTap={this.handleOpen}
        >
          <ContentAdd />
        </FloatingActionButton>
        {organizationData.organization && (
          <div>
            <Dialog
              {...dataTest('editPersonDialog')}
              title='Edit user'
              modal={false}
              open={Boolean(this.state.userEdit)}
              onRequestClose={() => { this.setState({ userEdit: false }) }}
            >
              <UserEdit
                organizationId={organizationData.organization && organizationData.organization.id}
                userId={this.state.userEdit}
                onRequestClose={this.updateUser}
              />
            </Dialog>
            <Dialog
              title='Invite new texters'
              actions={[
                <FlatButton
                  {...dataTest('inviteOk')}
                  label='OK'
                  primary
                  onTouchTap={this.handleClose}
                />
              ]}
              modal={false}
              open={this.state.open}
              onRequestClose={this.handleClose}
            >
              <OrganizationJoinLink
                organizationUuid={organizationData.organization.uuid}
              />
            </Dialog>
          </div>
        )}
      </div>
    )
  }
}

AdminPersonList.propTypes = {
  mutations: PropTypes.object,
  params: PropTypes.object,
  personData: PropTypes.object,
  userData: PropTypes.object,
  organizationData: PropTypes.object,
  router: PropTypes.object,
  location: PropTypes.object
}

const mapMutationsToProps = ({ ownProps }) => ({
  editOrganizationRoles: (organizationId, userId, roles) => ({
    mutation: gql`
      mutation editOrganizationRoles($organizationId: String!, $userId: String!, $roles: [String], $campaignId: String) {
        editOrganizationRoles(organizationId: $organizationId, userId: $userId, roles: $roles, campaignId: $campaignId) {
          ${organizationFragment}
        }
      }
    `,
    variables: {
      organizationId,
      userId,
      roles,
      campaignId: ownProps.location.query.campaignId
    }
  })
})

const mapQueriesToProps = ({ ownProps }) => ({
  personData: {
    query: gql`query getPeople($organizationId: String!, $campaignId: String) {
      organization(id: $organizationId) {
        ${organizationFragment}
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId,
      campaignId: ownProps.location.query.campaignId
    },
    forceFetch: true
  },
  userData: {
    query: gql` query getCurrentUserAndRoles($organizationId: String!) {
      currentUser {
        id
        roles(organizationId: $organizationId)
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  },
  organizationData: {
    query: gql`query getOrganizationData($organizationId: String!) {
      organization(id: $organizationId) {
        id
        uuid
        campaigns(campaignsFilter: { isArchived: false }) {
          id
          title
        }
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
})

export default loadData(withRouter(AdminPersonList), { mapQueriesToProps, mapMutationsToProps })
