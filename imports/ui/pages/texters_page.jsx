import React from 'react'
import Paper from 'material-ui/Paper'
import { List, ListItem } from 'material-ui/List'
import { Roles } from 'meteor/alanning:roles'
import { createContainer } from 'meteor/react-meteor-data'
import { displayName } from '../../api/users/users'
import TextField from 'material-ui/TextField'

const Page = ({ texters, organizationId }) => (
  <Paper>
    <div>
      <TextField value={`${Meteor.absoluteUrl()}${organizationId}/join`} />
    </div>
    <List>
      {texters.map((texter) => (
        <ListItem
          key={texter._id}
          primaryText={displayName(texter)}
        />
      ))}
    </List>
  </Paper>
)

export const TextersPage = createContainer(({ organizationId }) => {
  const handle = Meteor.subscribe('texters.forOrganization', organizationId)
  return {
    organizationId,
    texters: Roles.getUsersInRole('texter', organizationId),
    loading: !handle.ready()
  }
}, Page)

