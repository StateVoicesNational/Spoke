import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'
import { withRouter } from 'react-router'

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container
  },
  content: {
    ...theme.layouts.multiColumn.flexColumn,
    paddingLeft: '2rem',
    paddingRight: '2rem',
    margin: '24px auto'
  }
})

class TexterDashboard extends React.Component {
  render() {
    const { main, topNav, fullScreen } = this.props
    return fullScreen ? (
      fullScreen
    ) : (
      <div>
        { topNav }
        <div className={css(styles.container)}>
          <div className={css(styles.content)}>
            { main }
          </div>
        </div>
      </div>
    )
  }
}

TexterDashboard.propTypes = {
  router: React.PropTypes.object,
  params: React.PropTypes.object,
  children: React.PropTypes.object,
  location: React.PropTypes.object
}

export default withRouter(TexterDashboard)
