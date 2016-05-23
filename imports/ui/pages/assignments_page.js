import React from 'react'
import Paper from 'material-ui/Paper'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { List, ListItem } from 'material-ui/List'
import { AppNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import { commonStyles } from '../components/styles'
import { Empty } from '../components/empty'
import SmsIcon from 'material-ui/svg-icons/communication/textsms';

export const AssignmentsPage = ({ assignments, organizationId, loading }) => (
  <AppPage
    navigation={(
      <AppNavigation
        organizationId={organizationId}
        title="Assignments"
      />
    )}
    content={assignments.length === 0 ? <Empty
      title="No assignments"
      icon={<SmsIcon />}
      /> : <List>
          { assignments.map((assignment) => (
            <ListItem
              key={assignment._id}
              onTouchTap={() => FlowRouter.go(`/${organizationId}/assignments/${assignment._id}`)}
              primaryText={assignment.campaign().title}
              secondaryText={assignment.campaign().description}
            />
          ))}
        </List>
    }
    loading={loading}
  />
)
