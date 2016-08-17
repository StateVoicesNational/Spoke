import React from 'react'
import Empty from '../components/Empty'
import OrganizationJoinLink from '../components/OrganizationJoinLink'
import FlatButton from 'material-ui/FlatButton'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'
import ContentAdd from 'material-ui/svg-icons/content/add'
import { Table, TableBody, TableRow, TableRowColumn } from 'material-ui/Table'
import Dialog from 'material-ui/Dialog'
import PeopleIcon from 'material-ui/svg-icons/social/people'
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
  state = {
    open: false
  }

  handleOpen = () => {
    this.setState({ open: true })
  }

  handleClose = () => {
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

  getHighestRole = (roles) => {
    if (roles.indexOf('OWNER') !== -1) {
      return 'OWNER'
    } else if (roles.indexOf('ADMIN') !== -1) {
      return 'ADMIN'
    } else if (roles.indexOf('TEXTER') !== -1) {
      return 'TEXTER'
    }
  }

  renderTexters() {
    const { people } = this.props.personData.organization
    console.log("PEOLPE", people)
    if (people.length === 0) {
      return (
        <Empty
          title='No people yet'
          icon={<PeopleIcon />}
        />
      )
    }
    return (
      <Table
        multiSelectable
      >
          <TableBody>
            {people.map((person) => (
              <TableRow
                key={person.id}
              >
                <TableRowColumn>{person.displayName}</TableRowColumn>
                <TableRowColumn>{person.email}</TableRowColumn>
                <TableRowColumn>
                  <DropDownMenu
                    value={this.getHighestRole(person.roles)}
                    disabled={person.id === this.props.userData.currentUser.id}
                    onChange={(event, index, value) => this.handleChange(person.id, value)}
                  >
                    <MenuItem value='OWNER' primaryText='Owner' />
                    <MenuItem value='ADMIN' primaryText='Admin' />
                    <MenuItem value='TEXTER' primaryText='Texter' />
                  </DropDownMenu>
                </TableRowColumn>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    )
  }

  render() {
    const { params } = this.props

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
            organizationId={params.organizationId}
          />
        </Dialog>
      </div>
    )
  }
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
      organizationId: ownProps.params.organizationId,
    },
    forceFetch: true
  },
  userData: {
    query: gql` query getCurrentUser {
      currentUser {
        id
      }
    }`,
    forceFetch: true
  }
})

export default loadData(AdminPersonList, { mapQueriesToProps, mapMutationsToProps})
