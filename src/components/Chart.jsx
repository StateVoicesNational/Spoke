import React from 'react'
import { Pie } from 'react-chartjs'

export default ({ data }) => {
  const chartColors = [
    '#F7464A',
    '#46BFBD',
    '#FDB45C',
    '#949FB1',
    '#4D5360'
  ]

  const pieData = data.map(([label, value], index) => {
    return {
      label,
      value,
      color: chartColors[index % chartColors.length]
    }
  })
  return (
    <div>
      <Pie data={pieData} />
      <div>
        {pieData.map((datum) => (
          <span style={{
            backgroundColor: datum.color,
            padding: 5,
            margin: 5,
            fontSize: 12
          }}>
            {datum.label}
          </span>
        ))}
      </div>
    </div>
  )
}
