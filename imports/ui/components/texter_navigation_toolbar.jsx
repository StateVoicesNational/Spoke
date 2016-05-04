import React from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'
import IconButton from 'material-ui/IconButton/IconButton'
import LinearProgress from 'material-ui/LinearProgress'
import RaisedButton from 'material-ui/RaisedButton'
import { ResponseDropdown } from './response_dropdown'


const styles = {
  toolbar: {
    backgroundColor: 'white'
  },
  toolbarTitle: {
    fontSize: "12px"
  }
}

export const TexterNavigationToolbar = ({ hasPrevious, onPrevious, contactIndex, contactCount, hasNext, onNext, contact, onSendMessage, faqScripts}) => (
  <Toolbar style={styles.toolbar}>
    <ToolbarGroup firstChild>
      <RaisedButton
        onClick={onSendMessage}
        label="Send"
        primary
      />
      <ToolbarSeparator />
      <ResponseDropdown
        responses={faqScripts}
        onScriptChange={this.handleScriptChange}
      />
    </ToolbarGroup>
    <ToolbarGroup float="right">
      <ToolbarTitle style={styles.toolbarTitle} text={`${contactIndex + 1} of ${contactCount}`} />
      <IconButton>
        <NavigateBeforeIcon />
      </IconButton>
      <IconButton>
        <NavigateNextIcon />
      </IconButton>
    </ToolbarGroup>
  </Toolbar>
)