import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
const muiTheme = getMuiTheme();

export const App = ({content}) => (
  <div>
    <div className="row">
      <div className="col-xs-6 col-sm-6 col-md-8 col-lg-10">
          <div>
            <MuiThemeProvider muiTheme={muiTheme}>
              {content()}
            </MuiThemeProvider>
          </div>
      </div>
    </div>
  </div>
)
