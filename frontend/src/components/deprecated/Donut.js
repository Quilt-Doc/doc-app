import React, { Component } from "react";
import ReactApexChart from "react-apexcharts";

import styled from 'styled-components';

class Donut extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
      
        series: [44, 55, 41],
        options: {
          chart: {
            type: 'donut',
          },
          legend: {
            show: false
        },
        dataLabels: {
            enabled: false
        },

          responsive: [{
            breakpoint: 480,
            options: {
                
            }
          }]
        },
      };
    }

  

    render() {
      return (
        <Container>
            <div id="chart">
                <ReactApexChart options={this.state.options} series={this.state.series} type="donut" />
            </div>
        </Container>
      );
    }
}

export default Donut

const Container = styled.div`
    width: 5rem;
    height: 5rem;
    margin-left: -1.3rem;
    margin-top: -1rem;
`