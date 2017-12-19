import PropTypes from 'prop-types'
import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'

const inlineStyles = {
  icon: {
    width: 200,
    height: 200,
    opacity: 0.2
  }
}

// removing pencil image for mobile widths smaller than 450px

const styles = StyleSheet.create({
  container: {
    marginTop: '10px',
    width: 200,
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  onlyDesktop: {
    '@media(max-width: 450px)': {
      display: 'none'
    }
  },
  title: {
    ...theme.text.header,
    opacity: 0.2,
    textAlign: 'center'
  },
  content: {
    marginTop: '15px',
    textAlign: 'center'
  }
})

const Empty = ({ title, icon, content, displayAll }) => (
  <div className={ displayAll ? css(styles.container) : css(styles.onlyDesktop) }>
    {React.cloneElement(icon, { style: inlineStyles.icon })}
    <div className={css(styles.title)}>
     {title}
    </div>
    {content ? (<div className={css(styles.content)}>
      {content}
    </div>) : ''}
  </div>
)

Empty.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.object,
  content: PropTypes.object,
  displayAll: PropTypes.string
}

export default Empty
