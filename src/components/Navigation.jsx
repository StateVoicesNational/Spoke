import PropTypes from 'prop-types'
import React from 'react'
import { withRouter } from 'react-router'

import Paper from '@material-ui/core/Paper';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Divider from '@material-ui/core/Divider';

const Navigation = function Navigation(props) {
  const { sections, switchListItem } = props

  return (
    <Paper
      rounded={false}
      zDepth={2}
      style={{
        height: '100%'
      }}
    >
      <List>
        {sections.map((section) => (
          <ListItem
            key={section.name}
            primaryText={section.name}
            onClick={() => props.router.push(section.url)}
          />
        ))}
        <Divider />
        {switchListItem}
      </List>
    </Paper>
  )
}

Navigation.propTypes = {
  sections: PropTypes.array,
  switchListItem: PropTypes.object,
  router: PropTypes.object
}

export default withRouter(Navigation)
