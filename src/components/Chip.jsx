import React from 'react'

// Credit to materialize CSS
// Material UI coming out with Chip
const styles = {
  chip: {
    display: 'inline-block',
    height: '32px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
    lineHeight: '32px',
    padding: '0 12px',
    borderRadius: '16px',
    backgroundColor: '#e4e4e4',
    margin: 5
  },
  icon: {
    cursor: 'pointer',
    float: 'right',
    fontSize: '16px',
    lineHeight: '32px',
    height: '30px',
    width: '16px',
    paddingLeft: '8px',
    color: 'rgba(0,0,0,0.6)'
  }
}

export default function Chip({ text, iconRightClass, onIconRightTouchTap, onTouchTap, style = {} }) {
  return (
    <div style={_.extend({}, styles.chip, style)} onTouchTap={onTouchTap}>
      {text}
      {iconRightClass ? React.createElement(iconRightClass, { style: styles.icon, onTouchTap: onIconRightTouchTap }) : ''}
    </div>
  )
}
