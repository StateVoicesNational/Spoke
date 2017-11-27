import type from 'prop-types';
import React from 'react';
import theme from '../styles/theme'

const Slider = ({ maxValue, value, color, direction }) => {
  const valuePercent = Math.round(value / maxValue * 100)
  return (
    <div
      style={{
        height: 25,
        width: '100%',
        backgroundColor: theme.colors.white,
        textAlign: `${direction === 0 ? 'left' : 'right'}`
      }}
    >
      <div
        style={{
          width: `${valuePercent}%`,
          backgroundColor: color,
          height: 25,
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
