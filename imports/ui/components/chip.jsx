import React, { Component } from 'react'

// TODO: Credit to materialize CSS
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
    backgroundColor: '#e4e4e4'
  }
}

export const Chip = ({text}) => (
  <div style={styles.chip}>
    { text }
  </div>
)