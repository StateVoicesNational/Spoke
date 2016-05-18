import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
const muiTheme = getMuiTheme();
import { createContainer } from 'meteor/react-meteor-data'
import { Login } from '../components/login'

export const App = createContainer(() => {
  return {
    user: Meteor.user()
  }
}, (props) => {
  return (
    <div>
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          <Login user={props.user} />
         {props.content()}
        </div>
      </MuiThemeProvider>
    </div>
  )
})
