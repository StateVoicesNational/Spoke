import React from 'react'
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'
import IconButton from 'material-ui/IconButton/IconButton'
import LinearProgress from 'material-ui/LinearProgress'

export const TexterNavigationToolbar = ({ hasPrevious, onPrevious, contactIndex, contactCount, hasNext, onNext, contact}) => (
  <div>
  <Toolbar>
    <ToolbarGroup firstChild float="left">
      <IconButton
        disabled={!hasPrevious}
        onClick={onPrevious}
      >
        <NavigateBeforeIcon />
      </IconButton>

    </ToolbarGroup>
    <ToolbarGroup>
      <ToolbarTitle text={`${contactCount} remaining`} />
    </ToolbarGroup>
    <ToolbarGroup lastChild float="right">
      <IconButton
        disabled={!hasNext}
        onClick={onNext}
      >
        <NavigateNextIcon />
      </IconButton>
    </ToolbarGroup>
  </Toolbar>
  <LinearProgress mode="determinate" value={contactIndex * 100/contactCount} />
  </div>
)