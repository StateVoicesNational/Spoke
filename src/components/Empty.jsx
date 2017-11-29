import PropTypes from 'prop-types';
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

const styles = StyleSheet.create({
  container: {
    marginTop: '56px',
    width: 200,
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  title: {
    ...theme.text.header,
    opacity: 0.2,
    textAlign: 'center'
  }
})

const Empty = ({ title, icon }) => (
  <div className={css(styles.container)}>
    {React.cloneElement(icon, { style: inlineStyles.icon })}
    <div className={css(styles.title)}>
     {title}
    </div>
  </div>
)

Empty.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.object
}

export default Empty
