import React from 'react'
import { List, ListItem } from 'material-ui/List'
import Dialog from 'material-ui/Dialog'
import PeopleIcon from 'material-ui/svg-icons/social/people'
import Empty from '../components/Empty'
import OrganizationJoinLink from '../components/OrganizationJoinLink'
import FlatButton from 'material-ui/FlatButton'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'
import theme from '../styles/theme'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
class AdminTexterList extends React.Component {
  state = {
    open: false
  }

  handleOpen = () => {
    this.setState({ open: true })
  }

  handleClose = () => {
    this.setState({ open: false })
  }

  renderTexters() {
    const { texters } = this.props.data.organization
    if (texters.length === 0) {
      return (
        <Empty
          title='No texters yet'
          icon={<PeopleIcon />}
        />
      )
    }
    return (
      <List>
        {texters.map((texter) => (
          <ListItem
            key={texter.id}
            primaryText={texter.displayName}
          />
        ))}
      </List>
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

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getTexters($organizationId: String!) {
      organization(id: $organizationId) {
        texters {
          id
          displayName
        }
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
})

export default loadData(AdminTexterList, { mapQueriesToProps })
