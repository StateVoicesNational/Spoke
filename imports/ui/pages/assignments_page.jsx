import React from 'react'
import Paper from 'material-ui/Paper'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { List, ListItem } from 'material-ui/List'
import { AppNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import { commonStyles } from '../components/styles'
import { Empty } from '../components/empty'
import SmsIcon from 'material-ui/svg-icons/communication/textsms';
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts.js'
import { AssignmentsList } from '../../ui/components/assignments_list'

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
      /> : (
        <AssignmentsList
          assignments={assignments}
          organizationId={organizationId}
        />
      )
    }
    loading={loading}
  />
)

