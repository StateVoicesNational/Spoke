import PropTypes from 'prop-types'
import React from 'react'
import TextField from 'material-ui/TextField'
import { dataTest } from '../lib/attributes'

const DisplayLink = ({ url, textContent }) => (
  <div>
    <div>
      {textContent}
    </div>
    <TextField
      {...dataTest('url')}
      name={url}
      value={url}
      autoFocus
      onFocus={(event) => event.target.select()}
      fullWidth
    />
  </div>
)

DisplayLink.propTypes = {
  url: PropTypes.string,
  textContent: PropTypes.string
}

export default DisplayLink
