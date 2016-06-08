import React, { Component } from 'react'
import { Pie } from "react-chartjs"

export class Chart extends Component {
    render() {
        const { data } = this.props

        // #TODO does not handle large numbers of potential options
        // for now
        const chartColors = [
            "#F7464A",
             "#46BFBD",
             "#FDB45C",
             "#949FB1",
             "#4D5360",
        ]

        const pieData = data.map(([label, value], index) => {
            console.log("data label, value", label, value)
            return {
                label,
                value,
                color: chartColors[index % chartColors.length]
            }
        })

                // var pieData = [
                //     {
                //         value: 300,
                //         color:"#F7464A",
                //         highlight: "#FF5A5E",
                //         label: "Red"
                //     },
                //     {
                //         value: 50,
                //         color: "#46BFBD",
                //         highlight: "#5AD3D1",
                //         label: "Green"
                //     },
                //     {
                //         value: 100,
                //         color: "#FDB45C",
                //         highlight: "#FFC870",
                //         label: "Yellow"
                //     },
                //     {
                //         value: 40,
                //         color: "#949FB1",
                //         highlight: "#A8B3C5",
                //         label: "Grey"
                //     },
                //     {
                //         value: 120,
                //         color: "#4D5360",
                //         highlight: "#616774",
                //         label: "Dark Grey"
                //     }
                // ];

        return (

        <div>
          <Pie
            ref="chart"
            data={pieData}
          />
          <div>
          </div>
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
        )
    }


}