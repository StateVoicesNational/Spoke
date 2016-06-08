import React from 'react'
import { List, ListItem } from 'material-ui/List'
import { OptOuts } from '../../api/opt_outs/opt_outs'
import { createContainer } from 'meteor/react-meteor-data'
import { AdminNavigation } from '../../ui/components/navigation'
import { AppPage } from '../../ui/layouts/app_page'
import Dialog from 'material-ui/Dialog'
import ProhibitedIcon from 'material-ui/svg-icons/av/not-interested'
import { Empty } from '../components/empty'

class _OptOutsPage extends React.Component {
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
              icon={<ProhibitedIcon />}
            /> : <List>
              {optOuts.map((optOut) => (
                <ListItem
                  key={optOut._id}
                  primaryText={optOut.cell}
                  // secondaryText={displayName(optOut.contact())}
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
}, OptOutsPage)

