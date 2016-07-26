import React from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import { css, StyleSheet } from 'aphrodite'
import CircularProgress from 'material-ui/CircularProgress'

const styles = {
  button: {
    marginTop: 15
  }
}

const GSSubmitButton = (props) => {
  let icon = ''
  const extraProps = {}
  if (props.isSubmitting) {
    extraProps.disabled = true
    icon = (
      <CircularProgress
        size={0.5}
        style={{
          verticalAlign: 'middle',
          display: 'inline-block'
        }}
      />
    )
  }

  return (
    <div style={styles.button} {...props}>
      <RaisedButton
        primary
        type='submit'
        value='submit'
        {...props}
        {...extraProps}
      />
      {icon}
    </div>
  )
}

GSSubmitButton.propTypes = {
  isSubmitting: React.PropTypes.bool
}

export default GSSubmitButton
