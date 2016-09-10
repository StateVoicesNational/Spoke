import React, { PropTypes as type } from 'react'
import theme from '../styles/theme'

const BarHeight = 25

const Slider = ({ maxValue, value, color, direction }) => {
  const valuePercent = Math.round(value / maxValue * 100)
  return (
    <div
      style={{
        height: BarHeight,
        width: '100%',
        backgroundColor: theme.colors.white,
        textAlign: `${direction === 0 ? 'left' : 'right'}`
      }}
    >
      <div
        style={{
          width: `${valuePercent}%`,
          backgroundColor: color,
          height: BarHeight,
          display: 'inline-block',
          marginLeft: 'auto'
        }}
      >
      </div>
    </div>
  )
}

Slider.propTypes = {
  color: type.string,
  maxValue: type.number,
  value: type.number,
  direction: type.number
}

export default Slider
