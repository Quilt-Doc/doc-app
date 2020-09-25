import React, { Component } from "react";
import ReactApexChart from "react-apexcharts";

import styled from 'styled-components';

class ActivityFeed extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
      
        series: [{
            name: "Documents",
            data: [10, 17, 28, 15, 30, 6, 23, 12, 25],
        }, {
            name: "Snippets",
            data: [12, 11, 14, 18, 17, 13, 13, 26, 13]
          }
        ],
        options: {
          colors: ['#19E5BE', '#172A4E'],
          chart: {
            height: 350,
            type: 'line',
            zoom: {
              enabled: false
            },
            toolbar: {
                show: false
            }
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth'
          },
          
          markers: {
            size: 4,
            colors: ["#262626"],
            strokeColors: "#fff",
            strokeWidth: 2,
            hover: {
              size: 7,
            }
          },
          xaxis: {
            
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
          }
        },
      
      
      };
    }

  

    render() {
      return (
        <Container>
            <ListToolBar>
                <ListName>Activity Feed</ListName>
            </ListToolBar>
            <div id="chart">
                <ReactApexChart options={this.state.options} series={this.state.series} type="line" height={350} />
            </div>
        </Container>


        );
    }
}

export default ActivityFeed

const Container = styled.div`
    background-color: white;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
    margin-top: 4rem;
`

const ListToolBar = styled.div`
    height: 4.5rem;
    display: flex;
    border-bottom: 1px solid #EDEFF1;
    align-items: center;
`

const ListName = styled.div`
    margin-left: 2rem;
    color: #172A4E;
    font-size: 1.6rem;
    font-weight: 300;
`