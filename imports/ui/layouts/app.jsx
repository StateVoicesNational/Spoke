import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
const muiTheme = getMuiTheme();
import { createContainer } from 'meteor/react-meteor-data'
import { Login } from '../components/login'

// export const App = ({content}) => (
//   // <div>
//   //   <div className="row">
//   //     <div className="col-xs-6 col-sm-6 col-md-8 col-lg-10">
//           <div>
//             <div>
//             </div>
//             <MuiThemeProvider muiTheme={muiTheme}>
//               {content()}
//             </MuiThemeProvider>
//           </div>
//   //     </div>
//   //   </div>
//   // </div>
// )

export const App = createContainer(() => {
  return {
    user: Meteor.user()
  }
}, (props) => {
  console.log("props!", props.user)
  return (
    <div>
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
         { <Login user={props.user}/>}
         {props.content()}
        </div>
      </MuiThemeProvider>
    </div>
  )
});