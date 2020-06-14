import React, { Component } from 'react';

import 'antd/dist/antd.css';
import 'highlight.js/styles/atom-one-dark.css'

import { connect } from 'react-redux';

import {Button } from 'antd';

import styled from 'styled-components';

import ReactList from 'react-list';


  
class InlineReferenceSearch extends Component {
	constructor() {
		super();

        this.state = {
            value: '',
            suggestions: [],
          };
      }

      renderItemNamespace = (index, key) => {
        console.log('index: ', index);
        return <InlineSearchElement key={key}>{this.props.references[0]['results'][index].name} </InlineSearchElement>;
      }
      renderItemFunction = (index, key) => {
        console.log('index: ', index);
        return <InlineSearchElement key={key}>{this.props.references[1]['results'][index].name} </InlineSearchElement>;
      }
      renderItemMember = (index, key) => {
        console.log('index: ', index);
        return <InlineSearchElement key={key}>{this.props.references[2]['results'][index].name} </InlineSearchElement>;
      }

	  render() {
          console.log('lengths');
          console.log(this.props.references[0].length);
          console.log(this.props.references[1].length);
          console.log(this.props.references[2].length);
		return (
            <div style={{overflowY: 'auto', overflowX: 'hidden', maxHeight: 200, maxWidth:200, border: '1px solid black'}}>
                <h4>Namespaces</h4>
                <ReactList
                    itemRenderer={this.renderItemNamespace}
                    length={this.props.references[0].results.length}
                    type='uniform'
                />
                <h4>Functions</h4>
                <ReactList
                    itemRenderer={this.renderItemFunction}
                    length={this.props.references[1].results.length}
                    type='uniform'
                />
                <h4>Members</h4>
                <ReactList
                    itemRenderer={this.renderItemMember}
                    length={this.props.references[2].results.length}
                    type='uniform'
                />
            </div>
		);
	  }
}

const mapStateToProps = (state) => {
    console.log('MAPPING');
    return {
		references: [
			{
				title: 'Namespaces',
				results: state.repositories.references['namespaces']
			},
			{
				title: 'Functions',
				results: state.repositories.references['functions']
			},
			{
				title: 'Members',
				results: state.repositories.references['members']
			}
		]
    }
}

const InlineSearchElement = styled.div`
	:hover {
        background-color: red
    }
`
export default connect(mapStateToProps)(InlineReferenceSearch);
