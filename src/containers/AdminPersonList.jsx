import PropTypes from 'prop-types'
import React from 'react'
import { withRouter } from 'react-router'
import Empty from '../components/Empty'
import OrganizationJoinLink from '../components/OrganizationJoinLink'
import PasswordResetLink from '../components/PasswordResetLink'
import UserEdit from './UserEdit'
import FlatButton from 'material-ui/FlatButton'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import DropDownMenu from 'material-ui/DropDownMenu'
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

const organizationFragment = `
  id
  people(campaignId: $campaignId) {
    id
    displayName
    email
    roles(organizationId: $organizationId)
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
    passwordResetHash: ''
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
    this.setState({ open: false, passwordResetHash: '' })
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

  async resetPassword(userId) {
    const { userData: { currentUser } } = this.props
    if (currentUser.id !== userId) {
      const res = await this
        .props
        .mutations
        .resetUserPassword(this.props.params.organizationId, userId)
      this.setState({ passwordResetHash: res.data.resetUserPassword })
    }
  }

  renderCampaignList = () => {
    const { organizationData: { organization } } = this.props
    const campaigns = organization ? organization.campaigns : []
    return (
      <DropDownMenu
        value={this.props.location.query.campaignId}
        onChange={this.handleFilterChange}
      >
        <MenuItem primaryText='All Campaigns' />
        {campaigns.campaigns.map(campaign => (
          <MenuItem
            value={campaign.id}
            primaryText={campaign.title}
            key={campaign.id}
          />
        ))}
      </DropDownMenu>
    )
  }

  renderTexters() {
    const { personData, userData: { currentUser } } = this.props
    if (!currentUser) return <LoadingIndicator />

    const people = personData.organization && personData.organization.people || []
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
              <TableRowColumn>{person.displayName}</TableRowColumn>
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
                <FlatButton
                  label='Reset Password'
                  disabled={currentUser.id === person.id}
                  onTouchTap={() => { this.resetPassword(person.id) }}
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
        {this.renderCampaignList()}
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
            <Dialog
              title='Reset user password'
              actions={[
                <FlatButton
                  {...dataTest('passResetOK')}
                  label='OK'
                  primary
                  onTouchTap={this.handleClose}
                />
              ]}
              modal={false}
              open={Boolean(this.state.passwordResetHash)}
              onRequestClose={this.handleClose}
            >
              <PasswordResetLink
                passwordResetHash={this.state.passwordResetHash}
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
  }),
  resetUserPassword: (organizationId, userId) => ({
    mutation: gql`
      mutation resetUserPassword($organizationId: String!, $userId: Int!) {
        resetUserPassword(organizationId: $organizationId, userId: $userId)
      }
    `,
    variables: {
      organizationId,
      userId
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
          ... on CampaignsList{
            campaigns{
              id
              title
            }
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

export default loadData(withRouter(AdminPersonList), { mapQueriesToProps, mapMutationsToProps })
