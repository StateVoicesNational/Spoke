import React from 'react'
import Paper from 'material-ui/Paper'
import { List, ListItem } from 'material-ui/List'
import { Roles } from 'meteor/alanning:roles'
import { createContainer } from 'meteor/react-meteor-data'
import { displayName } from '../../api/users/users'
import TextField from 'material-ui/TextField'
import { AdminNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import Dialog from 'material-ui/Dialog'
import SmsIcon from 'material-ui/svg-icons/communication/textsms';
import { Empty } from '../components/empty'
import FlatButton from 'material-ui/FlatButton'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ContentAdd from 'material-ui/svg-icons/content/add'

// TODO same as campaigns page
const styles = {
  floatingButton: {
    margin: 0,
    top: 'auto',
    right: 20,
    bottom: 20,
    left: 'auto',
    position: 'fixed'
  }
}

class Page extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      open: false
    }

    this.handleOpen = this.handleOpen.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }
  handleOpen() {
    this.setState({ open: true})
  }

  handleClose() {
    this.setState({ open: false})
  }


  render() {
    const { organizationId, loading, texters} = this.props

    return (
      <AppPage
        navigation={<AdminNavigation
          title="Texters"
          organizationId={organizationId}
        />}
        content={
          <div>
          {texters.length === 0 ? <Empty
              title="No texters yet"
              icon={<SmsIcon />}
            /> : <List>
              {texters.map((texter) => (
                <ListItem
                  key={texter._id}
                  primaryText={displayName(texter)}
                />
              ))}
            </List>
          }
          <FloatingActionButton
            style={styles.floatingButton}
            onTouchTap={this.handleOpen}
          >
            <ContentAdd />
          </FloatingActionButton>
          <Dialog
            title="Dialog With Actions"
            actions={[
              <FlatButton
                label="OK"
                primary={true}
                keyboardFocused={true}
                onTouchTap={this.handleClose}
              />
            ]}
            modal={false}
            open={this.state.open}
            onRequestClose={this.handleClose}
          >
            Invite new texter!
          </Dialog>

          </div>
        }
        loading={loading}
      />
    )
  }
}

export const TextersPage = createContainer(({ organizationId }) => {
  const handle = Meteor.subscribe('texters.forOrganization', organizationId)
  return {
    organizationId,
    texters: Roles.getUsersInRole('texter', organizationId).fetch(),
    loading: !handle.ready()
  }
}, Page)

