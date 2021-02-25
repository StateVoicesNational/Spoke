import type from "prop-types";
import React from "react";
import { Pie } from "react-chartjs-2";

const Chart = ({ data }) => {
  const chartColors = ["#F7464A", "#46BFBD", "#FDB45C", "#949FB1", "#4D5360"];

  const pieData = {
    labels: data.map(([label]) => label),
    datasets: [
      {
        data: data.map(([, value]) => value),
        backgroundColor: data.map(
          (value, index) => chartColors[index % chartColors.length]
        )
      }
    ]
  };
  const options = {
    legend: {
      position: "bottom"
    }
  };

  return (
    <div>
      <Pie data={pieData} options={options} />
    </div>
  );
};

Chart.propTypes = {
  data: type.array
};

export default Chart;
