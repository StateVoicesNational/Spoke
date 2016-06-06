import React from 'react'
import { PublicNavigation } from '../components/public_navigation'
import RaisedButton from 'material-ui/RaisedButton'
import { FlowRouter } from 'meteor/kadira:flow-router'

const styles = {
  page: {
    backgroundColor: '#00CC99',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  header: {
    padding: "48px 24px",
    boxSizing: "border-box",
    overflow: 'hidden',
    backgroundColor: '#00CC99',
    color: "white",
  },
  navigation: {
    backgroundColor: '#00CC99'
  },
  container: {
    maxWidth: 800
  },
  row: {
    height: 400
  }
}
export const HomePage = ({ user, organizations }) => (
  <div style={styles.page}>
    <div>
      <PublicNavigation
        toolbarStyle={styles.navigation}
        user={user}
        organizations={organizations}
      />
    </div>
    <div style={styles.header}>
      <div className="container-fluid" style={styles.container}>
        <div className="row center-xs middle-xs" style={styles.row}>
          <div className="col-xs">
            <h1>Start texting.</h1>
            <h2>Engage with your volunteers & help your supporters take action.</h2>
            <RaisedButton
              label="Create a team"
              onTouchTap={() => FlowRouter.go('signup')}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
)
