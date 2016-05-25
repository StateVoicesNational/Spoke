import React from 'react'

const styles = {
  container: {
    marginTop: '56px'
  },
  title: {
    opacity: 0.1
  },
  icon: {
    width: '200',
    height: '200',
    opacity: 0.05
  }
}

// TODO: React clone element ok?
export const Empty = ({ title, icon }) => (
  <div className="row center-xs" style={styles.container}>
    <div className="col-xs">
      { React.cloneElement(icon, {style: styles.icon}) }
      <h2 style={styles.title}>
       { title }
      </h2>
    </div>
  </div>
)
