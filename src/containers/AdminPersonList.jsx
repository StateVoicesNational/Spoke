import PropTypes from 'prop-types';
import React from 'react';
import gql from 'graphql-tag';

import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import AddIcon from '@material-ui/icons/Add';
import PeopleIcon from '@material-ui/icons/People';

import { getHighestRole, ROLE_HIERARCHY } from '../lib';
import loadData from './hoc/load-data';
import theme from '../styles/theme';
import Empty from '../components/Empty';
import OrganizationJoinLink from '../components/OrganizationJoinLink';
import UserEdit from './UserEdit';


class SelectRoleDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      anchorEl: null,
      personRole: getHighestRole(props.person.roles),
    };

    this.handleClickRoles = this.handleClickRoles.bind(this);
    this.handleRoleChange = this.handleRoleChange.bind(this);
    this.handleCloseRoles = this.handleCloseRoles.bind(this);
  }

  handleClickRoles(event) {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleRoleChange(newRole) {
    this.props.handleChange(newRole);
    this.setState({
      anchorEl: null,
      personRole: newRole,
    });
  };

  handleCloseRoles() {
    this.setState({ anchorEl: null });
  };

  render() {
    const { anchorEl, personRole } = this.state;
    const { person, currentUser } = this.props;
    const isCurrentUser = person.id === currentUser.id,
          isOwner = personRole === 'OWNER' && getHighestRole(currentUser.roles) !== 'OWNER';
    const isDisabled = isCurrentUser || isOwner;
    return (
      <div>
        <List component="nav">
          <ListItem
            button={!isDisabled}
            aria-haspopup="true"
            aria-controls={`${person.id}-roles-menu`}
            aria-label="Contact Roles"
            onClick={isDisabled ? null : this.handleClickRoles}
          >
            <ListItemText
              primary={personRole}
            />
          </ListItem>
        </List>
        <Menu
          id={`${person.id}-roles-menu`}
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={this.handleCloseRoles}
        >
          {ROLE_HIERARCHY.map((role) => (
            <MenuItem
              key={person.id + '_' + role}
              disabled={role === 'OWNER' && getHighestRole(currentUser.roles) !== 'OWNER'}
              selected={personRole === role}
              onClick={this.handleRoleChange(role)}
            >
              {`${role.charAt(0).toUpperCase()}${role.substring(1).toLowerCase()}`}
            </MenuItem>
          ))}
        </Menu>
      </div>
    );
  }
}

SelectRoleDropdown.propTypes = {
  currentUser: PropTypes.object,
  person: PropTypes.object,
  handleChange: PropTypes.func,
}


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

    const currentUser = this.props.userData.currentUser

    return (
      <Table selectable={false}>
        <TableBody
          displayRowCheckbox={false}
          showRowHover={true}
        >
          {people.map((person) => (
            <TableRow
              key={person.id}
            >
              <TableCell>{person.displayName}</TableCell>
              <TableCell>{person.email}</TableCell>
              <TableCell>
                <SelectRoleDropdown
                  person={person}
                  currentUser={currentUser}
                  handleChange={(newRole) => this.handleChange(person.id, newRole)}
                />
                <Button label='Edit' onTouchTap={() => { this.editUser(person.id) }} />
              </TableCell>
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
        <Button
          variant="fab"
          style={theme.components.floatingButton}
          onTouchTap={this.handleOpen}
        >
          <AddIcon />
        </Button>
        <Dialog
          modal={false}
          open={Boolean(this.state.userEdit)}
          onRequestClose={() => { this.setState({ userEdit: false }) }}
        >
          <DialogTitle>Edit user</DialogTitle>
          <DialogContent>
            <UserEdit
              organizationId={organizationData.organization.id}
              userId={this.state.userEdit}
              onRequestClose={this.updateUser}
            />
          </DialogContent>
        </Dialog>
        <Dialog
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
        >
          <DialogTitle>Invite new texters</DialogTitle>
          <DialogContent>
            <OrganizationJoinLink
              organizationUuid={organizationData.organization.uuid}
            />
          </DialogContent>
          <DialogActions>
            <Button
              label='OK'
              primary
              onTouchTap={this.handleClose}
            />
          </DialogActions>
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
