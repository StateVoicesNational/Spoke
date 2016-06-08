import React, { Component } from 'react'
import { Pie } from "react-chartjs"

export class Chart extends Component {
    render() {
        var pieData = [
                    {
                        value: 300,
                        color:"#F7464A",
                        highlight: "#FF5A5E",
                        label: "Red"
                    },
                    {
                        value: 50,
                        color: "#46BFBD",
                        highlight: "#5AD3D1",
                        label: "Green"
                    },
                    {
                        value: 100,
                        color: "#FDB45C",
                        highlight: "#FFC870",
                        label: "Yellow"
                    },
                    {
                        value: 40,
                        color: "#949FB1",
                        highlight: "#A8B3C5",
                        label: "Grey"
                    },
                    {
                        value: 120,
                        color: "#4D5360",
                        highlight: "#616774",
                        label: "Dark Grey"
                    }
                ];


        return (

        <div>
          <Pie
            ref="chart"
            data={pieData}
            width="200"
            height="200"
          />
          <div>
          </div>
          {pieData.map((datum) => (
            <span style={{
                backgroundColor: datum.color,
                padding: 5,
                margin: 2,
                fontSize: 12
            }}>
              {datum.label}
            </span>
         ))}
        </div>
        )
    }


}