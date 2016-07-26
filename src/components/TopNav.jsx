import React from 'react'
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import ArrowBackIcon from 'material-ui/svg-icons/navigation/arrow-back'
import { Link } from 'react-router'
import UserMenu from '../containers/UserMenu'
import theme from '../styles/theme'


const inlineStyles = {
  // Material UI adds a stupid margin above the appbar that comes from the icon style
  iconLeftStyle: {
    margin: 0
  },
  // Material UI screws up the flex display when you try to add user agents
  appBar: {
    display: 'flex !important'
  }
}

const TopNav = ({ backToURL, title }) => (
  <AppBar
    style={inlineStyles.appBar}
    iconStyleLeft={inlineStyles.iconLeftStyle}
    iconStyleRight={inlineStyles.iconRightStyle}
    iconElementLeft={
      backToURL ? (
        <Link to={backToURL}>
          <IconButton style={{
            marginTop: 7
          }}>
            <ArrowBackIcon
              style={{
                fill: theme.colors.white
              }}
            />
          </IconButton>
        </Link>
      ) : <div />
    }

    title={title}
    iconElementRight={<UserMenu />}
  />
)

TopNav.propTypes = {
  backToURL: React.PropTypes.string,
  title: React.PropTypes.string.isRequired
}

export default TopNav
