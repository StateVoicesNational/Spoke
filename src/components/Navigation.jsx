import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import Subheader from 'material-ui/Subheader'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import { List, ListItem } from 'material-ui/List'
import AppBar from 'material-ui/AppBar'
import ArrowBackIcon from 'material-ui/svg-icons/navigation/arrow-back'
import IconButton from 'material-ui/IconButton'
import Divider from 'material-ui/Divider'
import { withRouter } from 'react-router'

class Navigation extends Component {
  render() {
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
}

Navigation.propTypes = {
  sections: React.PropTypes.array,
  switchListItem: React.PropTypes.object
}

export default withRouter(Navigation)
