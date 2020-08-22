import React, { Component } from 'react';

import 'antd/dist/antd.css';
import 'highlight.js/styles/atom-one-dark.css'

import { connect } from 'react-redux';

import {Button } from 'antd';

import styled from 'styled-components';

  
class InlineReference extends Component {
	constructor() {
		super();
	
		this.state = {
		  value: ''
		};
	  }

	  render() {

		var name = this.props.name;
		var kind = this.props.kind;
		var file = this.props.file;
		var lineNum = this.props.lineNum;

		return (
			<div style={{display: 'inline-block'}}>
				<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					padding: '0 1em 0em 1em',
					borderWidth: '2px',
					borderColor: 'black',
					borderStyle: 'solid'
				}}
				>
					<span>
						{kind}::{name}
					</span>
					&nbsp;
					&nbsp;
					<span>
						{file}::{lineNum}
					</span>
				</div>
			</div>
		);
	  }
}

const mapStateToProps = (state) => {

    return {
		references: []
    }
}

export default connect(mapStateToProps)(InlineReference);
