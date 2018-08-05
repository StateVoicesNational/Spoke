import PropTypes from 'prop-types'
import React from 'react'
import Paper from 'material-ui/Paper'
import { List, ListItem } from 'material-ui/List'
import Divider from 'material-ui/Divider'
import { withRouter } from 'react-router'
import camelCase from 'camelcase'
import { dataTest } from '../lib/attributes'
import { FlatButton } from 'material-ui'

const Navigation = function Navigation(props) {
  const { sections, switchListItem } = props

  if (props.showMenu) {
    return (
      <Paper
        rounded={false}
        zDepth={2}
        style={{
          height: '100%'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <FlatButton
            style={{}}
            label={'Close Menu'}
            onClick={() => props.onToggleMenu()}
          />
        </div>

        <List>
          {sections.map(section => (
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
  } else {
    return (<div></div>)
  }
}

Navigation.defaultProps = {
  showMenu: true
}

Navigation.propTypes = {
  sections: PropTypes.array,
  switchListItem: PropTypes.object,
  router: PropTypes.object,
  onToggleMenu: PropTypes.func.isRequired,
  showMenu: PropTypes.bool
}

export default withRouter(Navigation)
