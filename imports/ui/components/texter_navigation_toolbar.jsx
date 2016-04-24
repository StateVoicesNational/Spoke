import React from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'
import IconButton from 'material-ui/IconButton/IconButton'
import LinearProgress from 'material-ui/LinearProgress'

export const TexterNavigationToolbar = (props) => (
  <div>
  <Toolbar>
    <ToolbarGroup firstChild float="left">
      <IconButton
        disabled={!props.hasPrevious}
        onClick={props.onPrevious}
      >
        <NavigateBeforeIcon />
      </IconButton>

    </ToolbarGroup>
    <ToolbarGroup>
      <ToolbarTitle text={props.title} />
    </ToolbarGroup>
    <ToolbarGroup lastChild float="right">
      <IconButton
        disabled={!props.hasNext}
        onClick={props.onNext}
      >
        <NavigateNextIcon />
      </IconButton>
    </ToolbarGroup>
  </Toolbar>
  <LinearProgress mode="determinate" value={props.progressValue} />
  </div>
)