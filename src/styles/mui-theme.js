import { createMuiTheme } from '@material-ui/core/styles'
import grey from '@material-ui/core/colors/grey'
import { fade } from '@material-ui/core/styles/colorManipulator'

import theme from './theme'

const muiTheme = createMuiTheme({
  typography: {
    fontFamily: 'Poppins'
  },
  palette: {
    primary1Color: theme.colors.green,
    textColor: theme.text.body.color,
    primary2Color: theme.colors.orange,
    primary3Color: grey[400],
    accent1Color: theme.colors.orange,
    accent2Color: theme.colors.lightGray,
    accent3Color: grey[500],
    alternateTextColor: theme.colors.white,
    canvasColor: theme.colors.white,
    borderColor: theme.colors.lightGray,
    disabledColor: fade(grey[900], 0.3)
  }
}, { userAgent: 'all' })

export default muiTheme
