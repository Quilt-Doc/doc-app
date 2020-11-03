import React, { Component } from "react";
import ReactApexChart from "react-apexcharts";

import styled from 'styled-components';

class RepositoryHealth extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
        
        series: [75, 10, 15],
        options: {
            chart: {
            type: 'donut',
            },
            plotOptions: {
                pie: {
                  expandOnClick: false,
                  size: 10
                }
            },
            colors: ['#19e5be', '#172A4E', 'blue'],
        },
        
        
        };
    }

    

    render() {
        return (
        

    <div id="chart">
<ReactApexChart options={this.state.options} series={this.state.series} type="donut" />
</div>


        );
    }
}

export default RepositoryHealth;

