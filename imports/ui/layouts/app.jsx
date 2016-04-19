import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
const muiTheme = getMuiTheme();

export const App = ({content}) => <div><MuiThemeProvider muiTheme={muiTheme}>{content()}</MuiThemeProvider></div>
