import getMuiTheme from 'material-ui/styles/getMuiTheme'
import theme from './theme'
import { grey400, grey500, darkBlack } from 'material-ui/styles/colors'
import { fade } from 'material-ui/utils/colorManipulator'

const muiTheme = getMuiTheme({
  fontFamily: 'Poppins',
  palette: {
    primary1Color: theme.colors.green,
    textColor: theme.text.body.color,
    primary2Color: theme.colors.orange,
    primary3Color: grey400,
    accent1Color: theme.colors.orange,
    accent2Color: theme.colors.lightGray,
    accent3Color: grey500,
    alternateTextColor: theme.colors.white,
    canvasColor: theme.colors.white,
    borderColor: theme.colors.lightGray,
    disabledColor: fade(darkBlack, 0.3)
  }
}, { userAgent: 'all' })

export default muiTheme
