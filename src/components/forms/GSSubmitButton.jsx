import PropTypes from 'prop-types'
import React from 'react'
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

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

  const { label = '' } = props

  return (
    <div style={styles.button} {...props}>
      <Button
        variant='contained'
        primary
        type='submit'
        value='submit'
        {...props}
        {...extraProps}
      >
        {label}
      </Button>
      {icon}
    </div>
  )
}

GSSubmitButton.propTypes = {
  isSubmitting: PropTypes.bool
}

export default GSSubmitButton
