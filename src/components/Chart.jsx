import React, { PropTypes as type } from 'react'
import { Pie } from 'react-chartjs'

const Chart = ({ data }) => {
  const chartColors = [
    '#F7464A',
    '#46BFBD',
    '#FDB45C',
    '#949FB1',
    '#4D5360'
  ]

  const pieData = data.map(([label, value], index) => ({
    label,
    value,
    color: chartColors[index % chartColors.length]
  })

  return (
    <div>
      <Pie data={pieData} />
      <div>
        {pieData.map(({ label, color }) => (
          <span
            style={{
              backgroundColor: color,
              width: 20,
              padding: 5,
              margin: 5,
              fontSize: 12
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

Chart.propTypes = {
  data: type.array
}

export default Chart
