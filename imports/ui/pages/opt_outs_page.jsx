import React from 'react'
import Paper from 'material-ui/Paper'
import { List, ListItem } from 'material-ui/List'
import { OptOuts } from '../../api/opt_outs/opt_outs'
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
import { commonStyles } from '../components/styles'

class Page extends React.Component {
  render() {
    const { organizationId, loading, optOuts} = this.props

    return (
      <AppPage
        navigation={<AdminNavigation
          title="Opt-outs"
          organizationId={organizationId}
        />}
        content={
          <div>
          {optOuts.length === 0 ? <Empty
              title="No opt-outs yet"
              icon={<SmsIcon />}
            /> : <List>
              {optOuts.map((optOut) => (
                <ListItem
                  key={optOut._id}
                  primaryText={optOut.contact().cell}
                  secondaryText={displayName(optOut.contact())}
                />
              ))}
            </List>
          }
          </div>
        }
        loading={loading}
      />
    )
  }
}

export const OptOutsPage = createContainer(({ organizationId }) => {
  const handle = Meteor.subscribe('opt_outs')
  return {
    organizationId,
    optOuts: OptOuts.find({}).fetch(),
    loading: !handle.ready()
  }
}, Page)

