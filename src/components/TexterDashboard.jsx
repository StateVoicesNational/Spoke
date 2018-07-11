import PropTypes from 'prop-types'
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
  componentWillMount() {
    this.props.onEnter()
  }

  render() {
    const { main, topNav, fullScreen } = this.props
    return fullScreen || (
      <div>
        {topNav}
        <div className={css(styles.container)}>
          <div className={css(styles.content)}>
            {main}
          </div>
        </div>
      </div>
    )
  }
}

TexterDashboard.propTypes = {
  history: PropTypes.object,
  match: PropTypes.object,
  onEnter: PropTypes.func,
  children: PropTypes.object,
  location: PropTypes.object,
  main: PropTypes.element,
  topNav: PropTypes.element,
  fullScreen: PropTypes.bool
}

export default withRouter(TexterDashboard)
