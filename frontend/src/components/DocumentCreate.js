import React, { Component } from 'react';

import 'antd/dist/antd.css';
import 'highlight.js/styles/atom-one-dark.css'

import { connect } from 'react-redux';


class DocumentCreate extends Component {

	render() {

		return (
                <h1>TEST</h1>
    	);
  	}
}

const mapStateToProps = (state) => {
	// ', state.repositories.pathContents)
	console.log('DOCUMENT CREATE LISTENER');
	if (!(typeof state.repositories.fileContents == 'undefined' || state.repositories.fileContents == null) &&
		(typeof state.repositories.parsed_data == 'undefined' || state.repositories.parsed_data == null)) {
		console.log('fileContents exists');
	}

    return {}
}

export default connect(mapStateToProps)(DocumentCreate);