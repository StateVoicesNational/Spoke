import PropTypes from 'prop-types'
import React from 'react'
import Empty from '../components/Empty'
import OrganizationJoinLink from '../components/OrganizationJoinLink'
import UserEdit from './UserEdit'
import FlatButton from 'material-ui/FlatButton'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'
import ContentAdd from 'material-ui/svg-icons/content/add'
import { Table, TableBody, TableRow, TableRowColumn } from 'material-ui/Table'
import Dialog from 'material-ui/Dialog'
import PeopleIcon from 'material-ui/svg-icons/social/people'
import { getHighestRole } from '../lib'
import theme from '../styles/theme'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'

const organizationFragment = `
  id
  people {
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
    userEdit: false
  }

  handleOpen() {
    this.setState({ open: true })
  }

  handleClose() {
    this.setState({ open: false })
  }

  handleChange = async (userId, value) => {
    let roles = ['TEXTER']
    if (value === 'OWNER') {
      roles = roles.concat(['OWNER', 'ADMIN'])
    } else if (value === 'ADMIN') {
      roles = roles.concat('ADMIN')
    }

    await this
      .props
      .mutations
      .editOrganizationRoles(this.props.params.organizationId, userId, roles)
  }

  editUser(userId) {
    this.setState({ userEdit: userId })
  }

  updateUser() {
    this.setState({ userEdit: false })
    this.props.personData.refetch()
  }

  renderTexters() {
    const { people } = this.props.personData.organization
    if (people.length === 0) {
      return (
        <Empty
          title='No people yet'
          icon={<PeopleIcon />}
        />
      )
    }

    const options = [
      'TEXTER',
      'ADMIN',
      'OWNER'
    ]

    const currentUser = this.props.userData.currentUser

    return (
      <Table >
        <TableBody
          displayRowCheckbox={false}
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
                  {options.map((option) => (
                    <MenuItem
                      key={person.id + '_' + option}
                      value={option}
                      disabled={option === 'OWNER' && getHighestRole(currentUser.roles) !== 'OWNER'}
                      primaryText={`${option.charAt(0).toUpperCase()}${option.substring(1).toLowerCase()}`}
                    />
                  ))}
                </DropDownMenu>
                <FlatButton label='Edit' onTouchTap={() => { this.editUser(person.id) }} />
              </TableRowColumn>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  render() {
    const { params, organizationData } = this.props

    return (
      <div>
        {this.renderTexters()}
        <FloatingActionButton
          style={theme.components.floatingButton}
          onTouchTap={this.handleOpen}
        >
          <ContentAdd />
        </FloatingActionButton>
        <Dialog
          title='Edit user'
          modal={false}
          open={Boolean(this.state.userEdit)}
          onRequestClose={() => { this.setState({ userEdit: false }) }}
        >
          <UserEdit
            organizationId={organizationData.organization.id}
            userId={this.state.userEdit}
            onRequestClose={this.updateUser}
          />
        </Dialog>
        <Dialog
          title='Invite new texters'
          actions={[
            <FlatButton
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
    )
  }
}

AdminPersonList.propTypes = {
  mutations: PropTypes.object,
  params: PropTypes.object,
  personData: PropTypes.object,
  userData: PropTypes.object,
  organizationData: PropTypes.object
}

const mapMutationsToProps = () => ({
  editOrganizationRoles: (organizationId, userId, roles) => ({
    mutation: gql`
      mutation editOrganizationRoles($organizationId: String!, $userId: String!, $roles: [String]) {
        editOrganizationRoles(organizationId: $organizationId, userId: $userId, roles: $roles) {
          ${organizationFragment}
        }
      }
    `,
    variables: {
      organizationId,
      userId,
      roles
    }
  })
})

const mapQueriesToProps = ({ ownProps }) => ({
  personData: {
    query: gql`query getPeople($organizationId: String!) {
      organization(id: $organizationId) {
        ${organizationFragment}
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
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
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
})

export default loadData(AdminPersonList, { mapQueriesToProps, mapMutationsToProps })
