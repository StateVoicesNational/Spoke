import PropTypes from 'prop-types'
import React from 'react'
import Paper from 'material-ui/Paper'
import { List, ListItem } from 'material-ui/List'
import Divider from 'material-ui/Divider'
import { withRouter } from 'react-router'
import { dataTest, camelCase } from '../lib/attributes'

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
            {...dataTest(camelCase(`nav ${section.path}`))}
            key={section.name}
            primaryText={section.name}
            onTouchTap={() => props.router.push(section.url)}
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
