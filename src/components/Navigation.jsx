import React from 'react'
import Paper from 'material-ui/Paper'
import { List, ListItem } from 'material-ui/List'
import Divider from 'material-ui/Divider'
import { withRouter } from 'react-router'

const Navigation = function Navigation() {
  const { sections, switchListItem } = this.props

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
            onTouchTap={() => this.props.router.push(section.url)}
          />
        ))}
        <Divider />
        {switchListItem}
      </List>
    </Paper>
  )
}

Navigation.propTypes = {
  sections: React.PropTypes.array,
  switchListItem: React.PropTypes.object,
  router: React.PropTypes.object
}

export default withRouter(Navigation)
