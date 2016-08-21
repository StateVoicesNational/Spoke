import React, { PropTypes as type } from 'react'
import { StyleSheet, css } from 'aphrodite'
import theme from '../styles/theme'

const BarHeight = 25
const styles = StyleSheet.create({
  sliderContainer: {
    height: BarHeight,
    width: '100%',
    backgroundColor: theme.colors.lightGray
  }
})

const Slider = ({ minValue, maxValue, value }) => {
  const minValuePercent = Math.round(minValue / maxValue * 100)
  const valuePercent = Math.round((value - minValue) / maxValue * 100)
  return (
    <div className={css(styles.sliderContainer)}>
      <div
        style={{
          width: `${minValuePercent}%`,
          backgroundColor: theme.colors.darkGray,
          height: BarHeight,
          display: 'inline-block'
        }}
      >
      </div>
      <div
        style={{
          width: `${valuePercent}%`,
          backgroundColor: theme.colors.green,
          height: BarHeight,
          display: 'inline-block'
        }}
      >
      </div>
    </div>
  )
}

Slider.propTypes = {
  minValue: type.number,
  maxValue: type.number,
  value: type.number
}

export default Slider
